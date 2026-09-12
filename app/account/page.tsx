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
import { useQuery } from "@tanstack/react-query";
import {
  User, Package, MapPin, HelpCircle, LogOut, AlertTriangle,
  Pencil, Check, X, ChevronDown, ChevronUp, ShieldCheck,
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
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  items: OrderItem[];
}

// ── Status helpers ─────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; step: number }> = {
  PENDING:    { label: "Order Placed",  color: "bg-amber-100 text-amber-700",  step: 0 },
  PAID:       { label: "Payment Done",  color: "bg-blue-100 text-blue-700",    step: 1 },
  PROCESSING: { label: "Processing",   color: "bg-purple-100 text-purple-700", step: 2 },
  SHIPPED:    { label: "Shipped",       color: "bg-cyan-100 text-cyan-700",     step: 3 },
  DELIVERED:  { label: "Delivered",     color: "bg-green-100 text-green-700",   step: 4 },
  CANCELLED:  { label: "Cancelled",     color: "bg-red-100 text-red-600",       step: -1 },
  REFUNDED:   { label: "Refunded",      color: "bg-gray-100 text-gray-600",     step: -1 },
};

const TRACKING_STEPS = ["Placed", "Payment Done", "Processing", "Shipped", "Delivered"];

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
        <div className="md:hidden w-full mb-4 flex gap-2 overflow-x-auto pb-1">
          {NAV.map(({ tab: t, icon, label }) => (
            <button
              key={t}
              onClick={() => goTab(t)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t ? "bg-leaf text-white" : "bg-white border border-ink/10 text-ink/60"
              }`}
            >
              {icon} {label}
            </button>
          ))}
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
      <div className="mt-8">
        <DangerSection deactivateAccount={deactivateAccount} router={router} />
      </div>
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

// ── Orders section ─────────────────────────────────────────────

function OrdersSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ["my-orders"],
    queryFn:  async () => (await api.get("/orders")).data.data,
    retry:    false,
  });

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
      <div className="space-y-4">
        {orders.map((order) => {
          const meta   = STATUS_META[order.status] ?? STATUS_META.PENDING;
          const isOpen = expandedId === order.id;

          return (
            <div key={order.id} className="border border-ink/8 rounded-xl overflow-hidden">
              {/* Order header */}
              <button
                onClick={() => setExpandedId(isOpen ? null : order.id)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-cream/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-ink/40 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm font-medium text-ink mt-0.5">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} · ₹{order.total}
                    </p>
                    <p className="text-xs text-ink/40 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.color}`}>
                    {meta.label}
                  </span>
                  {isOpen ? <ChevronUp size={16} className="text-ink/30" /> : <ChevronDown size={16} className="text-ink/30" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-ink/5 px-4 py-4 bg-ink/[0.01]">

                  {/* Tracking stepper */}
                  {meta.step >= 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Tracking</p>
                      <div className="flex items-center gap-0">
                        {TRACKING_STEPS.map((stepLabel, i) => {
                          const done    = i <= meta.step;
                          const current = i === meta.step;
                          return (
                            <div key={stepLabel} className="flex-1 flex flex-col items-center">
                              <div className={`h-2.5 w-2.5 rounded-full border-2 z-10 ${
                                done ? "bg-leaf border-leaf" : "bg-white border-ink/20"
                              } ${current ? "ring-2 ring-leaf/30 ring-offset-1" : ""}`} />
                              {i < TRACKING_STEPS.length - 1 && (
                                <div className={`absolute h-0.5 w-full ${done ? "bg-leaf" : "bg-ink/10"}`} style={{ display: "none" }} />
                              )}
                              <p className={`text-[10px] mt-1.5 text-center leading-tight ${
                                done ? "text-leaf font-medium" : "text-ink/30"
                              }`}>{stepLabel}</p>
                            </div>
                          );
                        })}
                      </div>
                      {/* Connector line */}
                      <div className="flex mt-[-22px] mb-2 px-[5%]">
                        {TRACKING_STEPS.slice(0, -1).map((_, i) => (
                          <div key={i} className={`flex-1 h-0.5 ${i < meta.step ? "bg-leaf" : "bg-ink/10"}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Items</p>
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-3 items-start">
                        <div className="h-14 w-14 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                          {item.images?.[0] ? (
                            <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={18} className="text-ink/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{item.title}</p>
                          <p className="text-xs text-ink/50">{item.variantTitle}</p>
                          <p className="text-xs text-ink/40 font-mono">{item.sku}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium text-ink">₹{item.price}</p>
                          <p className="text-xs text-ink/40">Qty {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price summary */}
                  <div className="border-t border-ink/5 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-ink/60">
                      <span>Subtotal</span><span>₹{order.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-ink/60">
                      <span>Shipping</span>
                      <span>{order.shippingFee === 0 ? <span className="text-green-600">Free</span> : `₹${order.shippingFee}`}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-ink border-t border-ink/5 pt-1 mt-1">
                      <span>Total</span><span>₹{order.total}</span>
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div className="mt-3 p-3 bg-ink/[0.03] rounded-lg text-xs text-ink/50">
                    <p className="font-medium text-ink/70 mb-0.5">Deliver to: {order.shippingName}</p>
                    <p>{order.shippingCity}, {order.shippingState} — {order.shippingPincode}</p>
                  </div>
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

function AddressesSection() {
  return (
    <SectionShell title="Address Book">
      <div className="text-center py-12">
        <MapPin size={36} className="mx-auto text-ink/15 mb-3" />
        <p className="text-sm text-ink/50">Saved addresses coming soon.</p>
        <p className="text-xs text-ink/30 mt-1">Addresses are saved automatically at checkout.</p>
      </div>
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
          <p>📧 <a href="mailto:support@divantraa.com" className="text-leaf hover:underline">support@divantraa.com</a></p>
          <p>📞 <a href="tel:+918115352152" className="text-leaf hover:underline">+91 8115352152</a></p>
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
