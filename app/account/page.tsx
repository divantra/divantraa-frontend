"use client";

/**
 * app/account/page.tsx
 * Sidebar-based account page (inspired by Anveshan.farm).
 *
 * Sections:
 *   profile  — name / mobile / email (inline edit)
 *   orders   — order history with status badges + expandable order detail
 *   addresses— placeholder (Phase 3)
 *   help     — contact / FAQ
 *   danger   — deactivate account
 *
 * URL: /account?tab=orders  → opens directly on orders tab
 */

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Package, MapPin, HelpCircle, LogOut, AlertTriangle,
  Pencil, Check, X, ChevronDown, ChevronUp, ShieldCheck,
  Plus, Trash2, Star, Banknote, Truck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogout, useUpdateProfile, useDeactivateAccount } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

// ── Types ─────────────────────────────────────────────────────

type Tab = "profile" | "orders" | "addresses" | "help" | "danger";

interface OrderItem {
  id: string;
  title: string;
  variantTitle: string;
  sku: string;
  price: number;
  quantity: number;
  images: string[];
  // per-line (Amazon-style "order line"): its own status and what it cost after its discount share
  status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  lineTotal?: number | string;
  display?: { code: string; label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" };
}

interface StatusHistoryEntry {
  id:        string;
  status:    string;
  note:      string | null;
  createdAt: string;
}

interface Order {
  id:              string;
  orderNumber:     string | null;
  status:          string;
  paymentMethod:   string;
  paymentStatus:   string;
  subtotal:        number;
  shippingFee:     number;
  codFee:          number;
  total:           number;
  createdAt:       string;
  confirmedAt:     string | null;
  shippedAt:       string | null;
  deliveredAt:     string | null;
  cancelledAt:     string | null;
  cancelReason:    string | null;
  trackingNumber:  string | null;
  trackingCarrier: string | null;
  shippingName:    string;
  shippingLine1:   string;
  shippingLine2:   string | null;
  shippingCity:    string;
  shippingState:   string;
  shippingPincode: string;
  items:           OrderItem[];
  lines?:          OrderItem[];
  statusHistory:   StatusHistoryEntry[];
  display?:        { code: string; label: string; tone: "neutral" | "info" | "success" | "warning" | "danger"; hint?: string };
  refunds?:        CustomerRefund[];
}

interface RefundStep { key: string; label: string; at: string | null; state: "done" | "current" | "todo"; detail?: string }
interface CustomerRefund {
  reference: string; amount: number;
  status: "REQUESTED" | "APPROVED" | "IN_PROGRESS" | "REFUNDED" | "DELAYED" | "DECLINED";
  title: string; isCancellation: boolean; destination: string; arn: string | null; instant: boolean;
  items?: { title: string; variantTitle: string; quantity: number; amount: number }[];
  expectedFrom: string | null; expectedTo: string | null; declineReason: string | null;
  timeline: RefundStep[];
}

interface Address {
  id:       string;
  type:     string;
  fullName: string;
  phone:    string;
  line1:    string;
  line2:    string | null;
  city:     string;
  state:    string;
  pincode:  string;
  landmark: string | null;
  isDefault:boolean;
}

// ── Status helpers ─────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; step: number; cancellable?: boolean }> = {
  PENDING:    { label: "Order Placed",  color: "bg-amber-100 text-amber-700",  step: 0, cancellable: true },
  CONFIRMED:  { label: "Confirmed",     color: "bg-blue-100 text-blue-700",    step: 1, cancellable: true },
  PAID:       { label: "Payment Done",  color: "bg-blue-100 text-blue-700",    step: 1 },
  PROCESSING: { label: "Processing",   color: "bg-purple-100 text-purple-700", step: 2 },
  SHIPPED:    { label: "Shipped",       color: "bg-cyan-100 text-cyan-700",     step: 3 },
  DELIVERED:  { label: "Delivered",     color: "bg-green-100 text-green-700",   step: 4 },
  CANCELLED:  { label: "Cancelled",     color: "bg-red-100 text-red-600",       step: -1 },
  REFUNDED:   { label: "Refunded",      color: "bg-ink/10 text-ink/60",         step: -1 },
};

const TONE_COLOR: Record<string, string> = {
  neutral: "bg-ink/10 text-ink/60",
  info:    "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger:  "bg-red-100 text-red-600",
};

const orderLines = (o: Order): OrderItem[] => o.lines ?? o.items;

/** Items the customer can still cancel: COD, or paid online; before packing; not already in a pending request. */
function cancellableLines(o: Order): OrderItem[] {
  const paidOnline = o.paymentMethod === "ONLINE" && ["PAID", "PARTIALLY_REFUNDED"].includes(o.paymentStatus);
  if (o.paymentMethod === "ONLINE" && !paidOnline) return [];
  return orderLines(o).filter((l) => (l.status === "PENDING" || l.status === "CONFIRMED") && l.display?.code !== "CANCELLATION_REQUESTED");
}

/** COD: cancelled at once. Paid online: a request the admin approves (then refunded). */
function cancelKind(o: Order): "instant" | "request" | null {
  if (cancellableLines(o).length === 0) return null;
  return o.paymentMethod === "ONLINE" ? "request" : "instant";
}

const TRACKING_STEPS = ["Placed", "Confirmed", "Processing", "Shipped", "Delivered"];

// ── Sidebar nav items ──────────────────────────────────────────

const NAV: { tab: Tab; icon: React.ReactNode; label: string }[] = [
  { tab: "profile",   icon: <User size={16} />,      label: "Account Details" },
  { tab: "orders",    icon: <Package size={16} />,    label: "Order History" },
  { tab: "addresses", icon: <MapPin size={16} />,     label: "Address Book" },
  { tab: "help",      icon: <HelpCircle size={16} />, label: "Help & Support" },
];

// ── Suspense wrapper (required by Next.js 15 for useSearchParams) ──────────

export default function AccountPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-ink/40">Loading your account…</p>
      </main>
    }>
      <AccountPageInner />
    </Suspense>
  );
}

// ── Main page ─────────────────────────────────────────────────

function AccountPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, isHydrated } = useAuthStore();
  const logout          = useLogout();
  const updateProfile   = useUpdateProfile();
  const deactivateAccount = useDeactivateAccount();

  const [tab, setTab] = useState<Tab>(
    (searchParams.get("tab") as Tab | null) ?? "profile"
  );

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (isHydrated && !user) router.replace("/");
  }, [isHydrated, user, router]);

  // Sync tab with URL query
  const goTab = useCallback((t: Tab) => {
    setTab(t);
    router.replace(`/account?tab=${t}`, { scroll: false });
  }, [router]);

  // While the auth-refresh is still in flight, show a pulsing skeleton so
  // the page is never blank. (isHydrated starts false and is only set true
  // after AuthProvider's POST /auth/refresh resolves — this can race with
  // a client-side navigation from the login modal.)
  if (!isHydrated) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-24 rounded-2xl bg-ink/5 mb-6" />
        <div className="flex gap-6">
          <div className="hidden md:block w-52 h-64 rounded-2xl bg-ink/5 shrink-0" />
          <div className="flex-1 h-80 rounded-2xl bg-ink/5" />
        </div>
      </main>
    );
  }

  // Auth is resolved but no user → redirect (effect already queued it)
  if (!user) return null;

  const mobileDisplay = user.mobile.startsWith("+91")
    ? user.mobile.slice(3) : user.mobile;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-[70vh]">

      {/* ── Greeting banner ─────────────────────────────────── */}
      <div className="bg-gradient-to-r from-forest to-leaf rounded-2xl px-6 py-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-white/70 text-sm">Welcome back,</p>
          <h1 className="text-white font-display text-2xl font-semibold">
            {user.name ?? "Friend"}
          </h1>
          <p className="text-white/60 text-xs mt-0.5">+91 {mobileDisplay}</p>
        </div>
        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <ShieldCheck size={14} /> Admin Panel
          </Link>
        )}
      </div>

      <div className="flex gap-6 items-start">

        {/* ── Sidebar ─────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden sticky top-20">
          {NAV.map(({ tab: t, icon, label }) => (
            <button
              key={t}
              onClick={() => goTab(t)}
              className={`flex items-center gap-3 px-4 py-3.5 text-sm text-left transition-colors border-b border-ink/5 last:border-0 ${
                tab === t
                  ? "bg-leaf/8 text-leaf font-medium"
                  : "text-ink/60 hover:bg-cream hover:text-ink"
              }`}
            >
              <span className={tab === t ? "text-leaf" : "text-ink/30"}>{icon}</span>
              {label}
            </button>
          ))}
          <div className="border-t border-ink/5">
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={16} />
              {logout.isPending ? "Logging out…" : "Log out"}
            </button>
          </div>
        </aside>

        {/* ── Mobile tab strip ────────────────────────────── */}
        <div className="md:hidden w-full mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {NAV.map(({ tab: t, icon, label }) => (
              <button
                key={t}
                onClick={() => goTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                  tab === t ? "bg-leaf text-white" : "bg-white border border-ink/10 text-ink/60"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="mt-2.5 flex items-center gap-2 text-sm text-red-400 hover:text-red-600 font-medium px-1 min-h-[44px]"
          >
            <LogOut size={15} />
            {logout.isPending ? "Logging out…" : "Log out"}
          </button>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {tab === "profile"   && <ProfileSection user={user} updateProfile={updateProfile} />}
          {tab === "orders"    && <OrdersSection />}
          {tab === "addresses" && <AddressesSection />}
          {tab === "help"      && <HelpSection />}
        </div>
      </div>

      {/* ── Danger zone (always below) ───────────────────── */}
      {/* <div className="mt-8">
        <DangerSection deactivateAccount={deactivateAccount} router={router} />
      </div> */}
    </main>
  );
}

// ── Profile section ────────────────────────────────────────────

function ProfileSection({ user, updateProfile }: { user: any; updateProfile: any }) {
  const [editingName,  setEditingName]  = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameInput,    setNameInput]    = useState("");
  const [emailInput,   setEmailInput]   = useState("");
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);

  function saveName() {
    const trimmed = nameInput.trim();
    if (trimmed.length < 2) { setError("Name must be at least 2 characters."); return; }
    setError(null);
    updateProfile.mutate({ name: trimmed }, {
      onSuccess: () => { setEditingName(false); flash("Name updated."); },
      onError:   (err: unknown) => setError(getAxiosErrorMessage(err)),
    });
  }

  function saveEmail() {
    const trimmed = emailInput.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address."); return;
    }
    setError(null);
    updateProfile.mutate({ email: trimmed || null }, {
      onSuccess: () => { setEditingEmail(false); flash(trimmed ? "Email updated." : "Email removed."); },
      onError:   (err: unknown) => {
        const status = (err as any)?.response?.status;
        setError(status === 409
          ? "That email is already linked to another account."
          : getAxiosErrorMessage(err));
      },
    });
  }

  function flash(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  return (
    <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6">
      <h2 className="font-semibold text-ink mb-5 flex items-center gap-2">
        <User size={16} className="text-leaf" /> Account Details
      </h2>

      {success && <Toast msg={success} type="success" />}
      {error   && <Toast msg={error}   type="error" />}

      <div className="space-y-5">
        {/* Name */}
        <Field label="Full name">
          {editingName ? (
            <InlineEdit
              value={nameInput}
              onChange={setNameInput}
              onSave={saveName}
              onCancel={() => { setEditingName(false); setError(null); }}
              loading={updateProfile.isPending}
              placeholder="Your full name"
            />
          ) : (
            <FieldValue
              value={user.name}
              placeholder="Not set"
              onEdit={() => { setNameInput(user.name ?? ""); setEditingName(true); setError(null); }}
            />
          )}
        </Field>

        {/* Mobile (read-only) */}
        <Field label="Mobile number">
          <p className="text-sm text-ink">
            +91 {user.mobile.startsWith("+91") ? user.mobile.slice(3) : user.mobile}
          </p>
          <p className="text-xs text-ink/40 mt-0.5">Cannot be changed</p>
        </Field>

        {/* Email */}
        <Field label="Email address">
          {editingEmail ? (
            <InlineEdit
              value={emailInput}
              onChange={setEmailInput}
              onSave={saveEmail}
              onCancel={() => { setEditingEmail(false); setError(null); }}
              loading={updateProfile.isPending}
              placeholder="you@example.com"
              type="email"
            />
          ) : (
            <FieldValue
              value={user.email}
              placeholder="Not set"
              editLabel={user.email ? "Edit" : "Add"}
              onEdit={() => { setEmailInput(user.email ?? ""); setEditingEmail(true); setError(null); }}
            />
          )}
        </Field>

        {/* Role badge */}
        <Field label="Account type">
          <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${
            user.role === "ADMIN"
              ? "bg-amber-100 text-amber-700"
              : "bg-leaf/10 text-leaf"
          }`}>
            {user.role}
          </span>
        </Field>
      </div>
    </div>
  );
}

// ── Refund tracking ────────────────────────────────────────────

const REFUND_CHIP: Record<CustomerRefund["status"], { label: string; cls: string }> = {
  REQUESTED:   { label: "Awaiting approval", cls: "bg-amber-100 text-amber-700" },
  APPROVED:    { label: "Approved",          cls: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In progress",       cls: "bg-blue-100 text-blue-700" },
  REFUNDED:    { label: "Refunded",          cls: "bg-green-100 text-green-700" },
  DELAYED:     { label: "Being resolved",    cls: "bg-amber-100 text-amber-700" },
  DECLINED:    { label: "Not approved",      cls: "bg-ink/10 text-ink/60" },
};

const fmtDay  = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const fmtWhen = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** One line for the order list: the refund's state at a glance, without opening the order. */
function refundSummary(r: CustomerRefund): string | null {
  const amt = `₹${Number(r.amount).toFixed(0)}`;
  switch (r.status) {
    case "REQUESTED":   return `Cancellation requested · refund of ${amt} once approved`;
    case "APPROVED":
    case "IN_PROGRESS": return r.expectedTo ? `Refund of ${amt} in progress · expected by ${fmtDay(r.expectedTo)}` : `Refund of ${amt} in progress`;
    case "REFUNDED":    return `Refund of ${amt} completed`;
    case "DELAYED":     return `Refund of ${amt} is being processed`;
    case "DECLINED":    return r.isCancellation ? "Cancellation request closed" : null;
  }
}

function RefundCard({ refund, onWithdraw, withdrawing }: { refund: CustomerRefund; onWithdraw?: () => void; withdrawing?: boolean }) {
  const chip = REFUND_CHIP[refund.status];
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{refund.title}</p>
          <p className="text-xs text-ink/50 mt-0.5">₹{Number(refund.amount).toFixed(2)} · to {refund.destination}</p>
          {refund.items && refund.items.length > 0 && (
            <p className="text-xs text-ink/60 mt-1">
              For: {refund.items.map((i) => `${i.title}${i.variantTitle ? ` (${i.variantTitle})` : ""} × ${i.quantity}`).join(", ")}
            </p>
          )}
        </div>
        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${chip.cls}`}>{chip.label}</span>
      </div>

      <ol className="mt-4 space-y-0">
        {refund.timeline.map((step, i) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                step.state === "done" ? "bg-leaf border-leaf" : step.state === "current" ? "border-amber-500 bg-white ring-4 ring-amber-100" : "border-ink/20 bg-white"
              }`}>
                {step.state === "done" && <span className="text-[9px] leading-none text-white">✓</span>}
              </span>
              {i < refund.timeline.length - 1 && <span className={`w-0.5 flex-1 my-1 min-h-[18px] ${step.state === "done" ? "bg-leaf/40" : "bg-ink/10"}`} />}
            </div>
            <div className="pb-4 min-w-0">
              <p className={`text-sm ${step.state === "todo" ? "text-ink/40" : "text-ink font-medium"}`}>{step.label}</p>
              {step.at && step.state === "done" && <p className="text-xs text-ink/40">{fmtWhen(step.at)}</p>}
              {step.detail && step.state !== "todo" && <p className={`text-xs mt-0.5 ${step.key === "declined" ? "text-red-600" : "text-ink/50"}`}>{step.detail}</p>}
              {step.detail && step.state === "todo" && <p className="text-xs mt-0.5 text-ink/30">{step.detail}</p>}
            </div>
          </li>
        ))}
      </ol>

      {refund.expectedFrom && refund.expectedTo && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Expected in {refund.destination} between <span className="font-semibold">{fmtDay(refund.expectedFrom)}</span> and <span className="font-semibold">{fmtDay(refund.expectedTo)}</span>.
        </p>
      )}
      {refund.status === "REFUNDED" && refund.arn && (
        <p className="mt-1 text-xs text-ink/50">Not in your account yet? Quote the bank reference number above when you ask your bank.</p>
      )}
      <p className="mt-3 text-[10px] text-ink/30 font-mono">Ref {refund.reference}</p>

      {onWithdraw && refund.status === "REQUESTED" && (
        <button onClick={onWithdraw} disabled={withdrawing} className="mt-3 text-xs font-medium text-ink/60 underline hover:text-ink disabled:opacity-50">
          {withdrawing ? "Withdrawing…" : "Changed your mind? Withdraw request"}
        </button>
      )}
    </div>
  );
}

// ── Orders section ─────────────────────────────────────────────

function OrdersSection() {
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError,  setCancelError]  = useState<string | null>(null);
  const [notice,       setNotice]       = useState<string | null>(null);
  const [picked,       setPicked]       = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn:  async () => (await api.get("/orders")).data.data,
    retry:    false,
  });

  const cancelOrder = useMutation({
    mutationFn: ({ orderId, reason, lineIds }: { orderId: string; reason: string; lineIds?: string[] }) =>
      api.post(`/orders/${orderId}/cancel`, { cancelReason: reason, ...(lineIds ? { lineIds } : {}) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setCancellingId(null); setCancelReason(""); setCancelError(null); setPicked(new Set());
      setNotice((res.data as { message?: string })?.message ?? null);
    },
    onError: (err) => setCancelError(getAxiosErrorMessage(err)),
  });

  const withdraw = useMutation({
    mutationFn: ({ orderId, reference }: { orderId: string; reference: string }) =>
      api.delete(`/orders/${orderId}/cancellation-request`, { params: { ref: reference } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setNotice((res.data as { message?: string })?.message ?? null);
    },
    onError: (err) => setNotice(getAxiosErrorMessage(err)),
  });

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;

  if (isLoading) return <SectionShell title="Order History"><p className="text-sm text-ink/40">Loading orders…</p></SectionShell>;

  if (isError || !orders?.length) return (
    <SectionShell title="Order History">
      <div className="text-center py-12">
        <Package size={40} className="mx-auto text-ink/15 mb-3" />
        <p className="text-ink/50 text-sm">No orders yet.</p>
        <Link href="/products" className="mt-3 inline-block text-sm text-leaf font-medium hover:underline">
          Start shopping →
        </Link>
      </div>
    </SectionShell>
  );

  return (
    <SectionShell title={`Order History (${orders.length})`}>
      {notice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-green-700/60 hover:text-green-800" aria-label="Dismiss">×</button>
        </div>
      )}
      <div className="space-y-4">
        {orders.map((order) => {
          const meta      = STATUS_META[order.status] ?? STATUS_META.PENDING;
          const pillLabel = order.display?.label ?? meta.label;
          const pillColor = order.display ? TONE_COLOR[order.display.tone] : meta.color;
          const kind      = cancelKind(order);
          const isOpen    = expandedId === order.id;
          const displayId = order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`;

          // Build timeline step dates from the actual timestamps
          const stepDates: (string | null)[] = [
            fmtDate(order.createdAt),
            fmtDate(order.confirmedAt),
            null,
            fmtDate(order.shippedAt),
            fmtDate(order.deliveredAt),
          ];

          return (
            <div key={order.id} className="border border-ink/8 rounded-xl overflow-hidden">
              {/* Order header */}
              <button
                onClick={() => setExpandedId(isOpen ? null : order.id)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-cream/50 transition-colors text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-leaf font-semibold font-mono">{displayId}</p>
                    {order.paymentMethod === "COD" && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                        <Banknote size={9} /> COD
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-ink mt-0.5">
                    {orderLines(order).filter((l) => l.status !== "CANCELLED").length || orderLines(order).length} item{(orderLines(order).filter((l) => l.status !== "CANCELLED").length || orderLines(order).length) !== 1 ? "s" : ""} · ₹{Number(order.total).toFixed(0)}
                  </p>
                  <p className="text-xs text-ink/40 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {(() => {
                    const latest = order.refunds?.[order.refunds.length - 1];
                    const line = latest ? refundSummary(latest) : null;
                    return line ? <p className="text-xs font-medium text-amber-700 mt-1">{line}</p> : null;
                  })()}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pillColor}`}>
                    {pillLabel}
                  </span>
                  {isOpen ? <ChevronUp size={16} className="text-ink/30" /> : <ChevronDown size={16} className="text-ink/30" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-ink/5 px-4 py-4 bg-ink/[0.01] space-y-5">

                  {order.display?.hint && order.display.tone !== "success" && (
                    <div className={`p-3 rounded-xl text-sm border ${
                      order.display.tone === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}>
                      {order.display.hint}
                    </div>
                  )}

                  {/* Refund tracking */}
                  {order.refunds && order.refunds.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider">Refund status</p>
                      {[...order.refunds].reverse().map((r) => (
                        <RefundCard key={r.reference} refund={r}
                          onWithdraw={() => withdraw.mutate({ orderId: order.id, reference: r.reference })} withdrawing={withdraw.isPending} />
                      ))}
                    </div>
                  )}

                  {/* Tracking stepper (with dates) */}
                  {meta.step >= 0 && (
                    <div>
                      <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Tracking</p>
                      <div className="relative">
                        <div className="flex justify-between mb-1">
                          {TRACKING_STEPS.map((stepLabel, i) => {
                            const done    = i <= meta.step;
                            const current = i === meta.step;
                            return (
                              <div key={stepLabel} className="flex flex-col items-center flex-1">
                                <div className={`h-2.5 w-2.5 rounded-full border-2 z-10 ${
                                  done ? "bg-leaf border-leaf" : "bg-white border-ink/20"
                                } ${current ? "ring-2 ring-leaf/30 ring-offset-1" : ""}`} />
                                <p className={`text-[9px] mt-1.5 text-center leading-tight ${done ? "text-leaf font-medium" : "text-ink/30"}`}>
                                  {stepLabel}
                                </p>
                                {stepDates[i] && <p className="text-[9px] text-ink/30 text-center mt-0.5">{stepDates[i]}</p>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="absolute top-[5px] left-[5%] right-[5%] flex -z-0">
                          {TRACKING_STEPS.slice(0, -1).map((_, i) => (
                            <div key={i} className={`flex-1 h-0.5 ${i < meta.step ? "bg-leaf" : "bg-ink/10"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracking number (when shipped) */}
                  {order.trackingNumber && (
                    <div className="flex items-start gap-3 p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                      <Truck size={16} className="text-cyan-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-cyan-700">Shipment Tracking</p>
                        <p className="text-sm font-mono text-cyan-900">{order.trackingNumber}</p>
                        {order.trackingCarrier && <p className="text-xs text-cyan-600">via {order.trackingCarrier}</p>}
                      </div>
                    </div>
                  )}

                  {/* Cancellation reason */}
                  {order.status === "CANCELLED" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs font-semibold text-red-600 mb-1">
                        Order cancelled{order.cancelledAt ? ` on ${fmtWhen(order.cancelledAt)}` : ""}
                      </p>
                      {order.cancelReason && <p className="text-sm text-red-700">{order.cancelReason}</p>}
                      {order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID" && order.refunds?.length === 0 && (
                        <p className="text-xs text-red-700/80 mt-1">Your payment will be refunded — we&apos;ll update this page as soon as it starts.</p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Items</p>
                    <div className="space-y-3">
                      {orderLines(order).map((item) => {
                        const cancelled = item.status === "CANCELLED";
                        return (
                          <div key={item.id} className={`flex gap-3 items-start ${cancelled ? "opacity-60" : ""}`}>
                            <div className="h-14 w-14 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                              {item.images?.[0]
                                ? <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-ink/20" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium text-ink truncate ${cancelled ? "line-through" : ""}`}>{item.title}</p>
                              <p className="text-xs text-ink/50">{item.variantTitle}</p>
                              {item.display && (
                                <span className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${TONE_COLOR[item.display.tone]}`}>{item.display.label}</span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium text-ink">₹{Number(item.lineTotal ?? Number(item.price) * item.quantity).toFixed(0)}</p>
                              <p className="text-xs text-ink/40">Qty {item.quantity}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price summary */}
                  <div className="border-t border-ink/5 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-ink/60"><span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(0)}</span></div>
                    <div className="flex justify-between text-ink/60">
                      <span>Shipping</span>
                      <span>{Number(order.shippingFee) === 0 ? <span className="text-green-600">Free</span> : `₹${Number(order.shippingFee)}`}</span>
                    </div>
                    {Number(order.codFee) > 0 && (
                      <div className="flex justify-between text-ink/60"><span>COD Charge</span><span>₹{Number(order.codFee)}</span></div>
                    )}
                    <div className="flex justify-between font-semibold text-ink border-t border-ink/5 pt-1 mt-1">
                      <span>Total</span><span>₹{Number(order.total).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-ink/40 pt-0.5">
                      <span>Payment</span>
                      <span className={order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED" ? "text-green-600 font-medium" : ""}>
                        {order.paymentMethod} · {
                          order.paymentStatus === "PAID" ? "Paid"
                          : order.paymentStatus === "PARTIALLY_REFUNDED" ? "Paid · partly refunded"
                          : order.paymentStatus === "REFUNDED" ? "Refunded"
                          : order.paymentStatus === "FAILED" ? "Not completed"
                          : order.paymentMethod === "COD" ? "Pay on delivery"
                          : "Awaiting payment"
                        }
                      </span>
                    </div>
                  </div>

                  {(order.refunds ?? []).some((r) => r.status === "REFUNDED") && (
                    <div className="flex justify-between text-sm text-green-700 font-medium -mt-3">
                      <span>Refunded</span>
                      <span>₹{(order.refunds ?? []).filter((r) => r.status === "REFUNDED").reduce((a, r) => a + Number(r.amount), 0).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Delivery address */}
                  <div className="p-3 bg-ink/[0.03] rounded-lg text-xs text-ink/50">
                    <p className="font-medium text-ink/70 mb-0.5">Deliver to: {order.shippingName}</p>
                    <p>{order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}</p>
                    <p>{order.shippingCity}, {order.shippingState} — {order.shippingPincode}</p>
                  </div>

                  {!kind && order.paymentMethod === "ONLINE" && (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") && ["PROCESSING", "SHIPPED"].includes(order.status) && (
                    <p className="text-xs text-ink/50">
                      This order is already {order.status === "SHIPPED" ? "shipped" : "being prepared"}, so it can no longer be cancelled online.
                      Contact support if you need help.
                    </p>
                  )}

                  {/* Cancel items / order */}
                  {kind && (() => {
                    const cancellable = cancellableLines(order);
                    const active = orderLines(order).filter((l) => l.status !== "CANCELLED");
                    const chosen = cancellable.filter((l) => picked.has(l.id));
                    const wholeOrder = chosen.length > 0 && chosen.length === active.length;
                    return (
                      <div>
                        {cancellingId === order.id ? (
                          <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                            <p className="text-sm text-red-700 font-medium mb-2">
                              {kind === "request" ? "Which items do you want to cancel?" : "Which items do you want to cancel?"}
                            </p>
                            <div className="space-y-2 mb-3">
                              {cancellable.map((l) => (
                                <label key={l.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                                  <input type="checkbox" className="h-4 w-4 accent-red-500" checked={picked.has(l.id)}
                                    onChange={(e) => setPicked((prev) => { const n = new Set(prev); if (e.target.checked) n.add(l.id); else n.delete(l.id); return n; })} />
                                  <span className="flex-1 truncate">{l.title} <span className="text-ink/40">· {l.variantTitle} × {l.quantity}</span></span>
                                  <span className="text-ink/60">₹{Number(l.lineTotal ?? Number(l.price) * l.quantity).toFixed(0)}</span>
                                </label>
                              ))}
                              {cancellable.length > 1 && (
                                <button type="button" className="text-xs text-red-600 underline"
                                  onClick={() => setPicked(chosen.length === cancellable.length ? new Set() : new Set(cancellable.map((l) => l.id)))}>
                                  {chosen.length === cancellable.length ? "Clear selection" : "Select all"}
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-red-500 mb-3">
                              {kind === "request"
                                ? `Your order stays as it is until we approve the request. Once approved, the amount for the selected item${chosen.length === 1 ? "" : "s"}${wholeOrder ? " and shipping" : ""} is refunded to your original payment method (usually 5–7 business days).`
                                : "This cannot be undone. Stock will be restored."}
                            </p>
                            <textarea
                              value={cancelReason}
                              onChange={e => setCancelReason(e.target.value)}
                              placeholder="Reason for cancelling (optional)…"
                              rows={2}
                              className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 mb-3 bg-white focus:outline-none focus:ring-1 focus:ring-red-300 resize-none"
                            />
                            {cancelError && <p className="text-xs text-red-600 mb-2">{cancelError}</p>}
                            <div className="flex gap-2">
                              <button
                                onClick={() => cancelOrder.mutate({
                                  orderId: order.id, reason: cancelReason || "Cancelled by customer",
                                  lineIds: wholeOrder ? undefined : chosen.map((l) => l.id),
                                })}
                                disabled={cancelOrder.isPending || chosen.length === 0}
                                className="bg-red-500 text-white text-xs font-medium rounded-lg px-4 py-2 hover:bg-red-600 disabled:opacity-50"
                              >
                                {cancelOrder.isPending ? "Sending…"
                                  : wholeOrder ? (kind === "request" ? "Request order cancellation" : "Cancel order")
                                  : (kind === "request" ? "Request cancellation of selected" : "Cancel selected items")}
                              </button>
                              <button onClick={() => { setCancellingId(null); setCancelReason(""); setCancelError(null); setPicked(new Set()); }}
                                className="border border-ink/10 text-ink text-xs font-medium rounded-lg px-4 py-2 hover:bg-ink/5">
                                Keep everything
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setCancellingId(order.id); setCancelError(null); setPicked(new Set(cancellable.map((l) => l.id))); }}
                            className="text-sm text-red-400 hover:text-red-600 font-medium hover:underline">
                            {kind === "request" ? "Cancel items / request refund" : "Cancel items / order"}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

// ── Addresses section ──────────────────────────────────────────

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Delhi","Jammu & Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

const emptyAddrForm = {
  type: "HOME", fullName: "", phone: "", line1: "", line2: "",
  city: "", state: "", pincode: "", landmark: "",
};

function AddressesSection() {
  const qc   = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [form,       setForm]       = useState({ ...emptyAddrForm });
  const [formError,  setFormError]  = useState<string | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);
  const [deleteErr,  setDeleteErr]  = useState<string | null>(null);

  const { data: addrData, isLoading } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn:  () => api.get("/addresses").then((r) => r.data.data),
  });
  const addresses = addrData ?? [];

  function refetch() { qc.invalidateQueries({ queryKey: ["addresses"] }); }

  const saveMutation = useMutation({
    mutationFn: (data: typeof emptyAddrForm) =>
      editingId
        ? api.patch(`/addresses/${editingId}`, data).then((r) => r.data.data)
        : api.post("/addresses", data).then((r) => r.data.data),
    onSuccess: () => { refetch(); setShowForm(false); setEditingId(null); setForm({ ...emptyAddrForm }); setFormError(null); },
    onError:   (err) => setFormError(getAxiosErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/addresses/${id}`),
    onSuccess: () => { refetch(); setDeleteId(null); setDeleteErr(null); },
    onError:   (err) => setDeleteErr(getAxiosErrorMessage(err)),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/addresses/${id}/default`),
    onSuccess: () => refetch(),
  });

  function validateForm() {
    if (!form.fullName.trim() || form.fullName.trim().length < 2) return "Full name is required.";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) return "Enter a valid 10-digit mobile.";
    if (!form.line1.trim() || form.line1.trim().length < 3) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state) return "State is required.";
    if (!/^\d{6}$/.test(form.pincode)) return "Enter a valid 6-digit pincode.";
    return null;
  }

  function openAdd() {
    const mobile = user?.mobile ?? "";
    const phone  = mobile.startsWith("+91") ? mobile.slice(3) : mobile;
    setForm({ ...emptyAddrForm, fullName: user?.name ?? "", phone });
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }
  function openEdit(addr: Address) {
    setForm({
      type: addr.type, fullName: addr.fullName, phone: addr.phone,
      line1: addr.line1, line2: addr.line2 ?? "",
      city: addr.city, state: addr.state, pincode: addr.pincode,
      landmark: addr.landmark ?? "",
    });
    setEditingId(addr.id);
    setFormError(null);
    setShowForm(true);
  }

  function handleSave() {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    saveMutation.mutate(form);
  }

  if (isLoading) return (
    <SectionShell title="Address Book">
      <p className="text-sm text-ink/40">Loading addresses…</p>
    </SectionShell>
  );

  return (
    <SectionShell title="Address Book">
      {/* Address list */}
      {addresses.length > 0 && !showForm && (
        <div className="space-y-3 mb-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border-2 rounded-xl p-4 ${addr.isDefault ? "border-leaf bg-leaf/5" : "border-ink/10"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm text-ink">{addr.fullName}</span>
                    <span className="text-xs bg-ink/8 text-ink/60 px-2 py-0.5 rounded-full">{addr.type}</span>
                    {addr.isDefault && (
                      <span className="text-xs bg-leaf/10 text-leaf px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star size={9} /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink/60">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? `, ${addr.landmark}` : ""}
                  </p>
                  <p className="text-sm text-ink/60">{addr.city}, {addr.state} — {addr.pincode}</p>
                  <p className="text-xs text-ink/40 mt-0.5">📞 {addr.phone}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => openEdit(addr)} className="text-xs text-leaf hover:underline flex items-center gap-1">
                    <Pencil size={11} /> Edit
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => defaultMutation.mutate(addr.id)}
                      disabled={defaultMutation.isPending}
                      className="text-xs text-ink/50 hover:text-ink hover:underline"
                    >
                      Set default
                    </button>
                  )}
                  <button onClick={() => setDeleteId(addr.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </div>

              {/* Delete confirm */}
              {deleteId === addr.id && (
                <div className="mt-3 border border-red-200 bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium mb-2">Delete this address?</p>
                  {deleteErr && <p className="text-xs text-red-600 mb-2">{deleteErr}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteMutation.mutate(addr.id)}
                      disabled={deleteMutation.isPending}
                      className="bg-red-500 text-white text-xs font-medium rounded px-3 py-1.5 hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      onClick={() => { setDeleteId(null); setDeleteErr(null); }}
                      className="border border-ink/10 text-ink text-xs font-medium rounded px-3 py-1.5 hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-8 mb-4">
          <MapPin size={32} className="mx-auto text-ink/15 mb-2" />
          <p className="text-sm text-ink/50">No saved addresses yet.</p>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="border border-ink/10 rounded-xl p-5 mb-4">
          <h3 className="font-medium text-sm text-ink mb-4">
            {editingId ? "Edit Address" : "New Address"}
          </h3>
          {formError && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {(([
              { key: "fullName", label: "Full Name *",      col2: true,  placeholder: "Recipient's full name" },
              { key: "phone",    label: "Mobile *",         col2: true,  placeholder: "10-digit mobile" },
              { key: "line1",    label: "Address Line 1 *", col2: true,  placeholder: "House/flat/street" },
              { key: "line2",    label: "Address Line 2",   col2: true,  placeholder: "Colony/locality (optional)" },
              { key: "landmark", label: "Landmark",         col2: true,  placeholder: "Near/opposite (optional)" },
              { key: "city",     label: "City *",           col2: false, placeholder: "City" },
              { key: "pincode",  label: "Pincode *",        col2: false, placeholder: "6-digit pincode", maxLength: 6 },
            ]) as { key: keyof typeof emptyAddrForm; label: string; col2: boolean; placeholder: string; maxLength?: number }[])
            .map(({ key, label, col2, placeholder, maxLength }) => (
              <div key={key} className={col2 ? "sm:col-span-2" : ""}>
                <label className="block text-xs text-ink/50 mb-1">{label}</label>
                <input
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className="w-full rounded-lg border border-ink/15 focus:border-leaf px-3 py-2 text-sm outline-none transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-ink/50 mb-1">State *</label>
              <select
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 focus:border-leaf px-3 py-2 text-sm outline-none transition-colors bg-white"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink/50 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border border-ink/15 focus:border-leaf px-3 py-2 text-sm outline-none transition-colors bg-white"
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="rounded-lg bg-leaf text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50"
            >
              {saveMutation.isPending ? "Saving…" : editingId ? "Update" : "Save Address"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setFormError(null); }}
              className="rounded-lg border border-ink/10 text-ink text-sm px-5 py-2.5 hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={openAdd}
          className="flex items-center gap-2 text-sm text-leaf font-medium hover:underline"
        >
          <Plus size={14} /> Add new address
        </button>
      )}
    </SectionShell>
  );
}

// ── Help section ───────────────────────────────────────────────

function HelpSection() {
  return (
    <SectionShell title="Help & Support">
      <div className="space-y-4 text-sm text-ink/70">
        <p>For any queries, reach us at:</p>
        <div className="space-y-2">
          <p>📧 <a href="mailto:divantraa@rediffmail.com" className="text-leaf hover:underline">divantraa@rediffmail.com</a></p>
          <p>📞 <a href="tel:+919008301490" className="text-leaf hover:underline">+91 9008301490</a></p>
        </div>
        <div className="border-t border-ink/5 pt-4">
          <p className="font-medium text-ink mb-2">Common questions</p>
          <ul className="space-y-1 text-ink/60 list-disc list-inside">
            <li>Orders ship within 1–2 business days</li>
            <li>Free shipping on orders above ₹999</li>
            <li>Returns accepted within 7 days of delivery</li>
            <li>Lab reports available on all product pages</li>
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}

// ── Danger zone ────────────────────────────────────────────────

function DangerSection({ deactivateAccount, router }: { deactivateAccount: any; router: any }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-red-100 p-6">
      <h2 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
        <AlertTriangle size={15} /> Danger Zone
      </h2>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-sm text-red-400 hover:text-red-600 font-medium hover:underline"
        >
          Deactivate my account
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700 font-medium mb-1">Are you sure?</p>
          <p className="text-xs text-red-500 mb-4">
            Your account will be deactivated and all active sessions revoked.
            Contact support to reactivate.
          </p>
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setError(null);
                deactivateAccount.mutate(undefined, {
                  onSuccess: () => router.replace("/"),
                  onError:   (err: unknown) => setError(getAxiosErrorMessage(err)),
                });
              }}
              disabled={deactivateAccount.isPending}
              className="bg-red-500 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-red-600 disabled:opacity-50"
            >
              {deactivateAccount.isPending ? "Deactivating…" : "Yes, deactivate"}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setError(null); }}
              className="border border-ink/10 text-ink text-sm font-medium rounded-lg px-4 py-2 hover:bg-ink/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared mini components ─────────────────────────────────────

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6">
      <h2 className="font-semibold text-ink mb-5 flex items-center gap-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink/40 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function FieldValue({ value, placeholder, editLabel = "Edit", onEdit }: {
  value: string | null | undefined; placeholder: string;
  editLabel?: string; onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className={`text-sm ${value ? "text-ink" : "text-ink/30"}`}>{value ?? placeholder}</p>
      <button onClick={onEdit} className="text-leaf text-xs flex items-center gap-1 hover:underline shrink-0 ml-3">
        <Pencil size={11} /> {editLabel}
      </button>
    </div>
  );
}

function InlineEdit({ value, onChange, onSave, onCancel, loading, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void;
  loading: boolean; placeholder: string; type?: string;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        autoFocus
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-ink/15 focus:border-leaf px-3 py-2 text-sm outline-none transition-colors"
      />
      <button
        onClick={onSave}
        disabled={loading}
        className="h-9 w-9 rounded-lg bg-leaf text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50"
        aria-label="Save"
      >
        <Check size={15} />
      </button>
      <button
        onClick={onCancel}
        className="h-9 w-9 rounded-lg border border-ink/10 flex items-center justify-center hover:bg-ink/5"
        aria-label="Cancel"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  const cls = type === "success"
    ? "bg-leaf/10 border-leaf/20 text-leaf"
    : "bg-red-50 border-red-200 text-red-600";
  return (
    <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${cls}`}>{msg}</div>
  );
}
