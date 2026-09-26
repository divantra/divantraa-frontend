"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Package, ChevronDown, ChevronUp, RefreshCw,
  Users, ShieldCheck, ShieldOff, Search, ShoppingBag,
  Truck, CheckCircle2, XCircle, Clock, AlertCircle,
  MapPin, User as UserIcon, Banknote, ExternalLink, Wallet,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Product } from "@/types/product";
import { getAxiosErrorMessage } from "@/lib/errorUtils";
import PaymentsPanel, { RefundBox, CancelLineBox } from "./PaymentsPanel";

// ── Types ─────────────────────────────────────────────────────

interface AdminUser {
  id: string; mobile: string; name: string | null;
  email: string | null; role: "CUSTOMER"|"ADMIN"|"STAFF"|"VENDOR";
  status: "ACTIVE"|"INACTIVE"|"BLOCKED";
}

interface OrderItem {
  id: string; title: string; variantTitle: string;
  sku: string; price: number; quantity: number; images: string[];
  status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  lineTotal?: number | string; refundedAmount?: number | string;
  display?: { code: string; label: string; tone: string };
}

interface StatusHistoryEntry {
  id: string; status: string; note: string | null; createdAt: string;
  actor: { id: string; name: string | null; mobile: string; role: string } | null;
}

interface AdminOrder {
  id: string; orderNumber: string | null; status: string;
  paymentMethod: string; paymentStatus: string;
  subtotal: number; shippingFee: number; codFee: number; total: number;
  trackingNumber: string | null; trackingCarrier: string | null;
  cancelReason: string | null; cancelledAt: string | null;
  confirmedAt: string | null; shippedAt: string | null; deliveredAt: string | null;
  createdAt: string;
  shippingName: string; shippingPhone: string;
  shippingLine1: string; shippingLine2: string | null;
  shippingCity: string; shippingState: string; shippingPincode: string; shippingLandmark: string | null;
  items: OrderItem[];
  lines?: OrderItem[];
  statusHistory?: StatusHistoryEntry[];
  user: { id: string; name: string | null; mobile: string; email: string | null };
  capturedAmount?: number | string; refundedAmount?: number | string;
  display?: { code: string; label: string; tone: string; hint?: string };
  refunds?: { status: string; reason: string; amount: number | string }[];
}

interface OrderMeta { total: number; page: number; limit: number; pages: number }

interface NewProductForm {
  title: string; slug: string; shortDescription: string; description: string;
  categoryId: string; images: string; isFeatured: boolean; isRecommended: boolean;
  variantTitle: string; variantSku: string; variantPrice: string; variantStock: string;
}

const emptyForm: NewProductForm = {
  title: "", slug: "", shortDescription: "", description: "",
  categoryId: "", images: "", isFeatured: false, isRecommended: false,
  variantTitle: "", variantSku: "", variantPrice: "", variantStock: "0",
};

// ── Status config ──────────────────────────────────────────────

type AdminTab = "orders" | "payments" | "products" | "users";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:    { label: "Pending",    color: "bg-amber-100 text-amber-700 border-amber-200",   icon: <Clock size={12} /> },
  CONFIRMED:  { label: "Confirmed",  color: "bg-blue-100 text-blue-700 border-blue-200",      icon: <CheckCircle2 size={12} /> },
  PAID:       { label: "Paid",       color: "bg-blue-100 text-blue-700 border-blue-200",      icon: <CheckCircle2 size={12} /> },
  PROCESSING: { label: "Processing", color: "bg-purple-100 text-purple-700 border-purple-200",icon: <RefreshCw size={12} /> },
  SHIPPED:    { label: "Shipped",    color: "bg-cyan-100 text-cyan-700 border-cyan-200",       icon: <Truck size={12} /> },
  DELIVERED:  { label: "Delivered",  color: "bg-green-100 text-green-700 border-green-200",   icon: <CheckCircle2 size={12} /> },
  CANCELLED:  { label: "Cancelled",  color: "bg-red-100 text-red-600 border-red-200",         icon: <XCircle size={12} /> },
  REFUNDED:   { label: "Refunded",   color: "bg-gray-100 text-gray-600 border-gray-200",      icon: <AlertCircle size={12} /> },
};

const PAY_STATUS_CONFIG: Record<string, string> = {
  PENDING:  "bg-amber-50 text-amber-600",
  PAID:     "bg-green-50 text-green-700",
  FAILED:   "bg-red-50 text-red-600",
  PARTIALLY_REFUNDED: "bg-amber-50 text-amber-700",
  REFUNDED: "bg-gray-50 text-gray-600",
};

const STATUS_ACTIONS: Record<string, Array<{ to: string; label: string; variant: "primary"|"warn"|"danger" }>> = {
  PENDING:    [{ to: "CONFIRMED",  label: "Confirm Order",       variant: "primary" }, { to: "CANCELLED", label: "Cancel", variant: "danger" }],
  CONFIRMED:  [{ to: "PROCESSING", label: "Start Processing",   variant: "primary" }, { to: "CANCELLED", label: "Cancel", variant: "danger" }],
  PAID:       [{ to: "PROCESSING", label: "Start Processing",   variant: "primary" }, { to: "CANCELLED", label: "Cancel", variant: "danger" }],
  PROCESSING: [{ to: "SHIPPED",    label: "Mark as Shipped",    variant: "warn"    }, { to: "CANCELLED", label: "Cancel", variant: "danger" }],
  SHIPPED:    [{ to: "DELIVERED",  label: "Mark as Delivered",  variant: "primary" }, { to: "CANCELLED", label: "Cancel", variant: "danger" }],
};

// ── Main page ─────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const qc     = useQueryClient();

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";
  const canAccess = isAdmin || isStaff;

  // Tab state
  const [adminTab, setAdminTab] = useState<AdminTab>("orders");

  // Product state
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<NewProductForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());
  const [stockEdit, setStockEdit] = useState<Record<string, string>>({});

  // User mgmt state
  const [userMobile,    setUserMobile]    = useState("");
  const [foundUser,     setFoundUser]     = useState<AdminUser | null>(null);
  const [userSearchErr, setUserSearchErr] = useState<string | null>(null);
  const [userRoleMsg,   setUserRoleMsg]   = useState<string | null>(null);

  // Orders state
  const [orderStatus,   setOrderStatus]   = useState("");
  const [orderSearch,   setOrderSearch]   = useState("");
  const [orderPage,     setOrderPage]     = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [actionModal,   setActionModal]   = useState<{ orderId: string; to: string } | null>(null);
  const [shipForm,      setShipForm]      = useState({ trackingNumber: "", trackingCarrier: "" });
  const [cancelReason,  setCancelReason]  = useState("");
  const [actionNote,    setActionNote]    = useState("");
  const [actionError,   setActionError]   = useState<string | null>(null);

  // Queries
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn:  async () => (await api.get<{ data: Product[] }>("/products", { params: { limit: 50 } })).data.data,
    enabled: isAdmin,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<{ data: AdminOrder[]; meta: OrderMeta }>({
    queryKey: ["admin-orders", orderStatus, orderSearch, orderPage],
    queryFn:  async () => {
      const params: Record<string, unknown> = { page: orderPage, limit: 20 };
      if (orderStatus) params.status  = orderStatus;
      if (orderSearch) params.search  = orderSearch;
      return (await api.get("/admin/orders", { params })).data;
    },
    enabled: canAccess,
  });

  // Mutations
  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const adjustStock = useMutation({
    mutationFn: ({ variantId, value }: { variantId: string; value: number }) =>
      api.patch(`/admin/variants/${variantId}/stock`, { operation: "set", value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const createProduct = useMutation({
    mutationFn: (payload: object) => api.post("/admin/products", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setShowForm(false); setForm(emptyForm); setFormError(null);
    },
    onError: (err) => setFormError(getAxiosErrorMessage(err, "Failed to create product")),
  });

  const searchUser = useMutation({
    mutationFn: async (mobile: string) => {
      const normalized = mobile.startsWith("+") ? mobile : `+91${mobile}`;
      const res = await api.get<{ user: AdminUser }>("/admin/users/search", { params: { mobile: normalized } });
      return res.data.user;
    },
    onSuccess: (u) => { setFoundUser(u); setUserSearchErr(null); },
    onError:   (err) => { setFoundUser(null); setUserSearchErr(getAxiosErrorMessage(err, "User not found")); },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser["role"] }) =>
      api.patch<{ user: AdminUser }>(`/admin/users/${id}/role`, { role }),
    onSuccess: (res) => {
      setFoundUser(res.data.user);
      setUserRoleMsg(`Role changed to ${res.data.user.role}. User must log in again.`);
      setTimeout(() => setUserRoleMsg(null), 5000);
    },
    onError: (err) => setUserSearchErr(getAxiosErrorMessage(err, "Failed to change role")),
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, body }: { orderId: string; body: object }) =>
      api.patch(`/admin/orders/${orderId}/status`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setActionModal(null); setCancelReason(""); setActionNote("");
      setShipForm({ trackingNumber: "", trackingCarrier: "" }); setActionError(null);
    },
    onError: (err) => setActionError(getAxiosErrorMessage(err, "Failed to update status")),
  });

  // ── Auth gates ────────────────────────────────────────────────

  if (!user) return (
    <main className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-ink/60">Please sign in to access the admin panel.</p>
      <button onClick={() => router.push("/")} className="mt-4 text-sm text-leaf hover:underline">Go home</button>
    </main>
  );

  if (!canAccess) return (
    <main className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-ink/60 text-lg">Access denied.</p>
      <p className="text-sm text-ink/40 mt-1">Role: {user.role} — requires ADMIN or STAFF.</p>
      <button onClick={() => router.push("/")} className="mt-4 text-sm text-leaf hover:underline">Go home</button>
    </main>
  );

  // ── Helpers ───────────────────────────────────────────────────

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreate = () => {
    if (!form.title || !form.slug || !form.description || !form.variantSku || !form.variantPrice) {
      setFormError("Title, slug, description, variant SKU and price are required."); return;
    }
    createProduct.mutate({
      title: form.title, slug: form.slug, shortDescription: form.shortDescription || undefined,
      description: form.description, categoryId: form.categoryId || undefined,
      images: form.images.split(",").map(s => s.trim()).filter(Boolean), isFeatured: form.isFeatured, isRecommended: form.isRecommended,
      variants: [{ title: form.variantTitle || "Default", options: {}, sku: form.variantSku,
        price: parseFloat(form.variantPrice), stock: parseInt(form.variantStock, 10) || 0,
        isDefault: true, images: [] }],
    });
  };

  const openAction = (orderId: string, to: string) => {
    setActionModal({ orderId, to }); setActionError(null);
    setCancelReason(""); setActionNote(""); setShipForm({ trackingNumber: "", trackingCarrier: "" });
  };

  const submitAction = () => {
    if (!actionModal) return;
    const { orderId, to } = actionModal;
    const body: Record<string, string> = { status: to };
    if (to === "SHIPPED") {
      if (!shipForm.trackingNumber) { setActionError("Tracking number is required"); return; }
      body.trackingNumber  = shipForm.trackingNumber;
      body.trackingCarrier = shipForm.trackingCarrier;
    }
    if (to === "CANCELLED") {
      if (!cancelReason) { setActionError("Cancel reason is required"); return; }
      body.cancelReason = cancelReason;
    }
    if (actionNote) body.note = actionNote;
    updateOrderStatus.mutate({ orderId, body });
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const fmtTime = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  // ── Render ────────────────────────────────────────────────────

  const orders = ordersData?.data ?? [];
  const meta   = ordersData?.meta;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Admin Panel</h1>
          <p className="text-sm text-ink/50 mt-0.5">{user.name ?? user.mobile} · {user.role}</p>
        </div>
        {adminTab === "products" && isAdmin && (
          <button onClick={() => { setShowForm(!showForm); setFormError(null); }}
            className="flex items-center gap-2 bg-leaf text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90">
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-ink/10">
        {([
          { key: "orders",   label: "Orders",   icon: <ShoppingBag size={15} />, adminOnly: false },
          { key: "payments", label: "Payments", icon: <Wallet size={15} />,      adminOnly: false },
          { key: "products", label: "Products", icon: <Package size={15} />,     adminOnly: true  },
          { key: "users",    label: "Users",    icon: <Users size={15} />,       adminOnly: true  },
        ] as const).map(({ key, label, icon, adminOnly }) => {
          if (adminOnly && !isAdmin) return null;
          return (
            <button key={key}
              onClick={() => setAdminTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                adminTab === key
                  ? "border-leaf text-leaf"
                  : "border-transparent text-ink/50 hover:text-ink"
              }`}
            >
              {icon}{label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ORDERS TAB
      ═══════════════════════════════════════════════════════════ */}
      {adminTab === "orders" && (
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            {/* Status pills */}
            <div className="flex flex-wrap gap-1.5">
              {["", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(s => (
                <button key={s}
                  onClick={() => { setOrderStatus(s); setOrderPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    orderStatus === s
                      ? "bg-leaf text-white border-leaf"
                      : "bg-white text-ink/60 border-ink/15 hover:border-ink/30"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="flex gap-2 sm:ml-auto">
              <input
                value={orderSearch}
                onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }}
                placeholder="Search order # or customer…"
                className="border border-ink/15 rounded-xl px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-leaf/30"
              />
              <button onClick={() => refetchOrders()}
                className="border border-ink/15 rounded-xl px-3 py-2 text-ink/40 hover:text-ink hover:border-ink/30 transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Order count */}
          {meta && (
            <p className="text-xs text-ink/40 mb-3">
              {meta.total} order{meta.total !== 1 ? "s" : ""}
              {orderStatus ? ` · filtered by ${orderStatus}` : ""}
            </p>
          )}

          {ordersLoading && <div className="text-ink/40 py-12 text-center text-sm">Loading orders…</div>}

          {!ordersLoading && orders.length === 0 && (
            <div className="text-center py-16 border border-dashed border-ink/15 rounded-2xl">
              <ShoppingBag size={36} className="mx-auto text-ink/15 mb-3" />
              <p className="text-ink/40 text-sm">No orders{orderStatus ? ` with status ${orderStatus}` : ""}.</p>
            </div>
          )}

          <div className="space-y-2">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
              const isOpen = expandedOrder === order.id;
              const displayId = order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`;
              const actions = STATUS_ACTIONS[order.status] ?? [];

              return (
                <div key={order.id} className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm">
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 gap-y-0.5 items-center">
                      {/* Order # + date */}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-leaf font-mono">{displayId}</p>
                        <p className="text-xs text-ink/40">{fmt(order.createdAt)}</p>
                      </div>
                      {/* Customer */}
                      <div className="min-w-0 truncate">
                        <p className="text-sm font-medium text-ink truncate">{order.user.name ?? order.shippingName}</p>
                        <p className="text-xs text-ink/40 truncate">{order.user.mobile}</p>
                      </div>
                      {/* Items + total */}
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-sm text-ink">₹{Number(order.total).toFixed(0)}</p>
                        <p className="text-xs text-ink/40">{(order.lines ?? order.items).length} item{(order.lines ?? order.items).length !== 1 ? "s" : ""}</p>
                      </div>
                      {/* Payment */}
                      <div className="shrink-0 hidden sm:block">
                        <span className={`text-[10px] font-medium px-2 py-1 rounded border ${PAY_STATUS_CONFIG[order.paymentStatus] ?? PAY_STATUS_CONFIG.PENDING}`}>
                          {order.paymentMethod} · {order.paymentStatus}
                        </span>
                      </div>
                      {/* Status */}
                      <div className="shrink-0">
                        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.icon}{order.display?.label ?? cfg.label}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                      className="text-ink/30 hover:text-ink transition-colors p-1 shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-ink/5 bg-ink/[0.01] p-4 sm:p-5 space-y-5">
                      {/* 2-col: customer + address */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-xl bg-white border border-ink/8 p-4">
                          <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2 flex items-center gap-1.5"><UserIcon size={12}/> Customer</p>
                          <p className="text-sm font-medium text-ink">{order.user.name ?? "—"}</p>
                          <p className="text-xs text-ink/60 mt-0.5">{order.user.mobile}</p>
                          {order.user.email && <p className="text-xs text-ink/40">{order.user.email}</p>}
                        </div>
                        <div className="rounded-xl bg-white border border-ink/8 p-4">
                          <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin size={12}/> Delivery Address</p>
                          <p className="text-sm font-medium text-ink">{order.shippingName}</p>
                          <p className="text-xs text-ink/60 mt-0.5">{order.shippingPhone}</p>
                          <p className="text-xs text-ink/50">{order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}</p>
                          <p className="text-xs text-ink/50">{order.shippingCity}, {order.shippingState} — {order.shippingPincode}</p>
                          {order.shippingLandmark && <p className="text-xs text-ink/40">Near: {order.shippingLandmark}</p>}
                        </div>
                      </div>

                      {/* Tracking info (when shipped) */}
                      {order.trackingNumber && (
                        <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-4 flex items-start gap-3">
                          <Truck size={16} className="text-cyan-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-cyan-700">Tracking</p>
                            <p className="text-sm font-mono text-cyan-900">{order.trackingNumber}</p>
                            {order.trackingCarrier && <p className="text-xs text-cyan-600">via {order.trackingCarrier}</p>}
                          </div>
                        </div>
                      )}

                      {/* Cancel reason */}
                      {order.cancelReason && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                          <p className="text-xs font-semibold text-red-600 mb-1">Cancellation Reason</p>
                          <p className="text-sm text-red-700">{order.cancelReason}</p>
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Items</p>
                        <div className="space-y-2.5">
                          {(order.lines ?? order.items).map(item => {
                            const cancelled = item.status === "CANCELLED";
                            const cancellable = item.status === "PENDING" || item.status === "CONFIRMED" || item.status === "PROCESSING";
                            const openRefund = item.display?.code === "CANCELLATION_REQUESTED";
                            return (
                              <div key={item.id} className={`flex gap-3 items-start ${cancelled ? "opacity-60" : ""}`}>
                                <div className="h-14 w-14 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                                  {item.images?.[0]
                                    ? <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-ink/20" /></div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium text-ink ${cancelled ? "line-through" : ""}`}>{item.title}</p>
                                  <p className="text-xs text-ink/50">{item.variantTitle}</p>
                                  <p className="text-xs font-mono text-ink/30">{item.sku}</p>
                                  {item.display && (
                                    <span className={`mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                      item.display.tone === "danger" ? "bg-red-100 text-red-600" : item.display.tone === "warning" ? "bg-amber-100 text-amber-700"
                                      : item.display.tone === "success" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{item.display.label}</span>
                                  )}
                                  {isAdmin && cancellable && !openRefund && (order.paymentMethod === "COD" || order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") && (
                                    <CancelLineBox orderId={order.id} lineId={item.id} title={item.title}
                                      onDone={() => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-refunds"] }); }} />
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-medium">₹{Number(item.lineTotal ?? Number(item.price) * item.quantity).toFixed(0)}</p>
                                  <p className="text-xs text-ink/40">Qty {item.quantity} × ₹{Number(item.price)}</p>
                                  {Number(item.refundedAmount ?? 0) > 0 && <p className="text-[10px] text-ink/40">refunded ₹{Number(item.refundedAmount).toFixed(0)}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Price summary */}
                        <div className="mt-4 border-t border-ink/5 pt-3 space-y-1 text-sm">
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
                        </div>
                      </div>

                      {/* Status timeline */}
                      {(order.statusHistory?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Status History</p>
                          <div className="relative space-y-0">
                            {(order.statusHistory ?? []).map((h, i) => {
                              const c = STATUS_CONFIG[h.status] ?? STATUS_CONFIG.PENDING;
                              return (
                                <div key={h.id} className="flex gap-3 items-start pb-3 last:pb-0">
                                  <div className="flex flex-col items-center">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${c.color}`}>{c.icon}</div>
                                    {i < (order.statusHistory?.length ?? 0) - 1 && <div className="w-px flex-1 bg-ink/10 my-1 min-h-[12px]" />}
                                  </div>
                                  <div className="flex-1 min-w-0 pt-0.5">
                                    <p className="text-xs font-medium text-ink">{c.label}</p>
                                    {h.note && <p className="text-xs text-ink/50 mt-0.5">{h.note}</p>}
                                    <p className="text-[10px] text-ink/30 mt-0.5">
                                      {fmtTime(h.createdAt)}
                                      {h.actor && ` · ${h.actor.name ?? h.actor.mobile} (${h.actor.role})`}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Refunds on this order */}
                      {(order.refunds?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">Refunds</p>
                          <div className="space-y-1">
                            {order.refunds!.map((r, i) => (
                              <p key={i} className="text-xs text-ink/70">
                                ₹{Number(r.amount).toFixed(2)} · {r.reason.replace(/_/g, " ").toLowerCase()} · <span className="font-medium">{r.status}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {isAdmin && order.paymentMethod === "ONLINE" && (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") && (
                        <RefundBox orderId={order.id} total={order.total} captured={order.capturedAmount ?? order.total} refunded={order.refundedAmount ?? 0}
                          onDone={() => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-refunds"] }); }} />
                      )}

                      {/* Action buttons */}
                      {actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-ink/5">
                          {actions.map(action => (
                            <button key={action.to}
                              onClick={() => openAction(order.id, action.to)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                action.variant === "primary" ? "bg-leaf text-white hover:opacity-90"
                                : action.variant === "warn"  ? "bg-cyan-600 text-white hover:opacity-90"
                                : "border border-red-300 text-red-500 hover:bg-red-50"
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              <button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}
                className="px-3 py-1.5 text-sm border border-ink/15 rounded-lg disabled:opacity-40 hover:border-ink/30 transition-colors">
                ← Prev
              </button>
              <span className="text-sm text-ink/50">Page {orderPage} of {meta.pages}</span>
              <button onClick={() => setOrderPage(p => Math.min(meta.pages, p + 1))} disabled={orderPage === meta.pages}
                className="px-3 py-1.5 text-sm border border-ink/15 rounded-lg disabled:opacity-40 hover:border-ink/30 transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {adminTab === "payments" && <PaymentsPanel isAdmin={isAdmin} />}

      {/* ═══════════════════════════════════════════════════════════
          PRODUCTS TAB
      ═══════════════════════════════════════════════════════════ */}
      {adminTab === "products" && isAdmin && (
        <div>
          {showForm && (
            <div className="bg-white border border-ink/10 rounded-2xl p-6 mb-6 shadow-sm">
              <h2 className="font-semibold text-ink mb-5">Create product</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Title *">
                  <input value={form.title}
                    onChange={e => { const t = e.target.value; setForm(f => ({ ...f, title: t, slug: handleSlug(t) })); }}
                    placeholder="A2 Cow Bilona Ghee" className={inputCls} />
                </Field>
                <Field label="Slug *">
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="a2-cow-bilona-ghee" className={inputCls} />
                </Field>
                <Field label="Short description">
                  <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                    placeholder="One-line teaser" className={inputCls} />
                </Field>
                <Field label="Category ID">
                  <input value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    placeholder="UUID" className={inputCls} />
                </Field>
                <Field label="Description *" className="sm:col-span-2">
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Full description" className={inputCls} />
                </Field>
                <Field label="Images (comma-separated URLs)" className="sm:col-span-2">
                  <input value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
                    placeholder="https://…/img1.jpg" className={inputCls} />
                </Field>
                <div className="sm:col-span-2 border-t border-ink/10 pt-4">
                  <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">Initial variant</p>
                  <div className="grid sm:grid-cols-4 gap-4">
                    <Field label="Variant title">
                      <input value={form.variantTitle} onChange={e => setForm(f => ({ ...f, variantTitle: e.target.value }))}
                        placeholder="500 ml Glass Jar" className={inputCls} />
                    </Field>
                    <Field label="SKU *">
                      <input value={form.variantSku} onChange={e => setForm(f => ({ ...f, variantSku: e.target.value }))}
                        placeholder="GHEE-A2-500-G" className={inputCls} />
                    </Field>
                    <Field label="Price (₹) *">
                      <input type="number" min="0" value={form.variantPrice}
                        onChange={e => setForm(f => ({ ...f, variantPrice: e.target.value }))}
                        placeholder="899" className={inputCls} />
                    </Field>
                    <Field label="Stock">
                      <input type="number" min="0" value={form.variantStock}
                        onChange={e => setForm(f => ({ ...f, variantStock: e.target.value }))}
                        placeholder="100" className={inputCls} />
                    </Field>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input id="isFeatured" type="checkbox" checked={form.isFeatured}
                    onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="rounded border-ink/20" />
                  <label htmlFor="isFeatured" className="text-sm text-ink">Mark as featured</label>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input id="isRecommended" type="checkbox" checked={form.isRecommended}
                    onChange={e => setForm(f => ({ ...f, isRecommended: e.target.checked }))} className="rounded border-ink/20" />
                  <label htmlFor="isRecommended" className="text-sm text-ink">Recommend as add-on (shown after add to cart)</label>
                </div>
              </div>
              {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}
              <div className="flex gap-3 mt-5">
                <button onClick={handleCreate} disabled={createProduct.isPending}
                  className="bg-leaf text-white rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {createProduct.isPending && <RefreshCw size={14} className="animate-spin" />} Create product
                </button>
                <button onClick={() => { setShowForm(false); setFormError(null); }}
                  className="border border-ink/20 rounded-xl px-5 py-2 text-sm text-ink/60 hover:border-ink/40">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {productsLoading && <div className="text-ink/40 py-12 text-center">Loading products…</div>}
          {!productsLoading && products?.length === 0 && (
            <div className="text-center py-16"><Package size={40} className="mx-auto text-ink/20 mb-3" /><p className="text-ink/40">No products yet.</p></div>
          )}

          <div className="space-y-3">
            {products?.map(product => (
              <div key={product.id} className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="h-12 w-12 rounded-xl bg-ink/5 overflow-hidden relative shrink-0">
                    {product.images[0] && <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink truncate">{product.title}</p>
                      {product.isRecommended && <span className="text-xs bg-leaf/10 text-leaf px-2 py-0.5 rounded-full shrink-0">Add-on</span>}
                      {product.isFeatured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">Featured</span>}
                      {!product.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">Inactive</span>}
                    </div>
                    <p className="text-xs text-ink/40 mt-0.5">
                      {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""} · {product.variants.reduce((s, v) => s + v.stock, 0)} units
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggle(product.id)} className="text-ink/40 hover:text-ink p-1">
                      {expanded.has(product.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button onClick={() => { if (confirm(`Deactivate "${product.title}"?`)) deleteProduct.mutate(product.id); }}
                      className="text-ink/30 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                  </div>
                </div>
                {expanded.has(product.id) && (
                  <div className="border-t border-ink/5 bg-ink/[0.02] overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-xs text-ink/40 border-b border-ink/5">
                        <th className="text-left px-5 py-2 font-medium">Variant</th>
                        <th className="text-left px-5 py-2 font-medium">SKU</th>
                        <th className="text-right px-5 py-2 font-medium">Price</th>
                        <th className="text-right px-5 py-2 font-medium">Stock</th>
                        <th className="text-right px-5 py-2 font-medium w-36">Set stock</th>
                      </tr></thead>
                      <tbody>
                        {product.variants.map(variant => (
                          <tr key={variant.id} className="border-b border-ink/5 last:border-0">
                            <td className="px-5 py-2.5 text-ink/80">{variant.title}{variant.isDefault && <span className="ml-1.5 text-xs text-leaf">(default)</span>}</td>
                            <td className="px-5 py-2.5 font-mono text-xs text-ink/50">{variant.sku}</td>
                            <td className="px-5 py-2.5 text-right">₹{Number(variant.price)}</td>
                            <td className="px-5 py-2.5 text-right">
                              <span className={variant.stock === 0 ? "text-red-500" : variant.stock <= (variant.lowStockAlert ?? 5) ? "text-amber-500" : "text-green-600"}>
                                {variant.stock}
                              </span>
                            </td>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center justify-end gap-2">
                                <input type="number" min="0" value={stockEdit[variant.id] ?? ""}
                                  onChange={e => setStockEdit(prev => ({ ...prev, [variant.id]: e.target.value }))}
                                  placeholder={String(variant.stock)} className="w-16 border border-ink/15 rounded-lg px-2 py-1 text-xs text-right" />
                                <button onClick={() => {
                                  const val = parseInt(stockEdit[variant.id] ?? "", 10);
                                  if (!isNaN(val)) {
                                    adjustStock.mutate({ variantId: variant.id, value: val });
                                    setStockEdit(prev => { const next = { ...prev }; delete next[variant.id]; return next; });
                                  }
                                }} className="text-leaf hover:text-leaf/70 text-xs font-medium">Save</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          USERS TAB
      ═══════════════════════════════════════════════════════════ */}
      {adminTab === "users" && isAdmin && (
        <div className="bg-white border border-ink/10 rounded-2xl p-6 shadow-sm">
          <div className="mb-5 p-4 bg-leaf/5 border border-leaf/15 rounded-xl text-sm text-ink/70 leading-relaxed">
            <p className="font-medium text-ink mb-1">How roles work</p>
            <ul className="space-y-1 text-xs">
              <li><span className="font-mono bg-ink/5 px-1 rounded">CUSTOMER</span> — default; can shop, cart, checkout</li>
              <li><span className="font-mono bg-ink/5 px-1 rounded">STAFF</span> — can view + manage orders (no product/user management)</li>
              <li><span className="font-mono bg-ink/5 px-1 rounded">ADMIN</span> — full access including products and user management</li>
              <li><span className="font-mono bg-ink/5 px-1 rounded">VENDOR</span> — reserved for future vendor portal</li>
            </ul>
          </div>

          <div className="flex gap-2 mb-4">
            <input value={userMobile} onChange={e => setUserMobile(e.target.value)}
              onKeyDown={e => e.key === "Enter" && searchUser.mutate(userMobile)}
              placeholder="+91XXXXXXXXXX or 10-digit number" className={inputCls + " flex-1"} />
            <button onClick={() => searchUser.mutate(userMobile)} disabled={searchUser.isPending || !userMobile}
              className="flex items-center gap-2 bg-ink text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40">
              {searchUser.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />} Search
            </button>
          </div>

          {userSearchErr && <p className="text-sm text-red-500 mb-3">{userSearchErr}</p>}
          {userRoleMsg && <div className="mb-3 rounded-lg bg-leaf/10 border border-leaf/20 text-leaf text-sm px-4 py-2.5">{userRoleMsg}</div>}

          {foundUser && (
            <div className="border border-ink/10 rounded-xl p-4 bg-ink/[0.02]">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-ink">{foundUser.name ?? <span className="text-ink/40">No name</span>}</p>
                  <p className="text-sm text-ink/60">{foundUser.mobile}</p>
                  {foundUser.email && <p className="text-xs text-ink/40">{foundUser.email}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${foundUser.role === "ADMIN" ? "bg-amber-100 text-amber-700" : foundUser.role === "STAFF" ? "bg-purple-100 text-purple-700" : "bg-ink/5 text-ink/60"}`}>{foundUser.role}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${foundUser.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{foundUser.status}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {foundUser.role !== "ADMIN" && (
                    <button onClick={() => changeRole.mutate({ id: foundUser.id, role: "ADMIN" })} disabled={changeRole.isPending}
                      className="flex items-center gap-2 bg-amber-500 text-white rounded-lg px-4 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50">
                      <ShieldCheck size={14} /> Promote to ADMIN
                    </button>
                  )}
                  {foundUser.role === "ADMIN" && (
                    <button onClick={() => changeRole.mutate({ id: foundUser.id, role: "CUSTOMER" })} disabled={changeRole.isPending}
                      className="flex items-center gap-2 border border-ink/20 text-ink/60 rounded-lg px-4 py-2 text-xs font-medium hover:border-red-300 hover:text-red-500 disabled:opacity-50">
                      <ShieldOff size={14} /> Remove ADMIN
                    </button>
                  )}
                  {foundUser.role !== "STAFF" && (
                    <button onClick={() => changeRole.mutate({ id: foundUser.id, role: "STAFF" })} disabled={changeRole.isPending}
                      className="flex items-center gap-2 border border-purple-200 text-purple-600 rounded-lg px-4 py-2 text-xs font-medium hover:bg-purple-50 disabled:opacity-50">
                      Set as STAFF
                    </button>
                  )}
                  {foundUser.role !== "CUSTOMER" && (
                    <button onClick={() => changeRole.mutate({ id: foundUser.id, role: "CUSTOMER" })} disabled={changeRole.isPending}
                      className="flex items-center gap-2 border border-ink/20 text-ink/60 rounded-lg px-4 py-2 text-xs font-medium hover:border-ink/40 disabled:opacity-50">
                      Set as CUSTOMER
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-ink/30 mt-3 font-mono">id: {foundUser.id}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          ACTION MODAL (confirm / ship / cancel)
      ═══════════════════════════════════════════════════════════ */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setActionModal(null); setActionError(null); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <h3 className="font-semibold text-ink mb-4">
              {actionModal.to === "CANCELLED" ? "Cancel Order" :
               actionModal.to === "SHIPPED"   ? "Ship Order"   :
               `Confirm: ${STATUS_CONFIG[actionModal.to]?.label ?? actionModal.to}`}
            </h3>

            {/* Shipping form */}
            {actionModal.to === "SHIPPED" && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-ink/60 mb-1">Tracking Number *</label>
                  <input value={shipForm.trackingNumber}
                    onChange={e => setShipForm(f => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="e.g. 123456789" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink/60 mb-1">Carrier (optional)</label>
                  <input value={shipForm.trackingCarrier}
                    onChange={e => setShipForm(f => ({ ...f, trackingCarrier: e.target.value }))}
                    placeholder="e.g. BlueDart, Delhivery" className={inputCls} />
                </div>
              </div>
            )}

            {/* Cancel reason */}
            {actionModal.to === "CANCELLED" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-ink/60 mb-1">Reason *</label>
                <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Item out of stock, customer requested…"
                  rows={3} className={inputCls} />
              </div>
            )}

            {/* Optional note for other transitions */}
            {actionModal.to !== "CANCELLED" && actionModal.to !== "SHIPPED" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-ink/60 mb-1">Note (optional)</label>
                <input value={actionNote} onChange={e => setActionNote(e.target.value)}
                  placeholder="Internal note for this status change" className={inputCls} />
              </div>
            )}

            {actionError && <p className="text-sm text-red-500 mb-3">{actionError}</p>}

            <div className="flex gap-3">
              <button onClick={submitAction} disabled={updateOrderStatus.isPending}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
                  actionModal.to === "CANCELLED" ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-leaf text-white hover:opacity-90"
                }`}>
                {updateOrderStatus.isPending && <RefreshCw size={14} className="animate-spin" />}
                {actionModal.to === "CANCELLED" ? "Cancel Order" : "Confirm"}
              </button>
              <button onClick={() => { setActionModal(null); setActionError(null); }}
                className="border border-ink/20 rounded-xl px-5 py-2.5 text-sm text-ink/60 hover:border-ink/40 transition-colors">
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Small helpers ──────────────────────────────────────────────

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-ink/60 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-ink/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/30 bg-white";
