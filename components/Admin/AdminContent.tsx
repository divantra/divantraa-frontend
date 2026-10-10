"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Package, ChevronDown, ChevronUp, RefreshCw,
  Users, ShieldCheck, ShieldOff, Search, ShoppingBag,
  Truck, CheckCircle2, XCircle, Clock, AlertCircle,
  MapPin, User as UserIcon, Wallet, Bell, LayoutDashboard,
  ExternalLink, LogOut, Menu, X, Copy, Check,
  BarChart3, ArrowUpRight, Sun, Moon
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import type { Product, Category } from "@/types/product";
import { getAxiosErrorMessage } from "@/lib/errorUtils";
import PaymentsPanel, { RefundBox, CancelLineBox } from "@/app/admin/PaymentsPanel";
import ShippingPanel from "@/app/admin/ShippingPanel";
import NotificationsPanel from "@/app/admin/NotificationsPanel";
import { VariantTable } from "@/app/admin/VariantManager";

// ── Types ─────────────────────────────────────────────────────

type AdminTab = "overview" | "orders" | "payments" | "shipping" | "notifications" | "products" | "users";

const VALID_TABS: AdminTab[] = [
  "overview",
  "orders",
  "payments",
  "shipping",
  "notifications",
  "products",
  "users",
];

interface NavItem {
  key: AdminTab;
  label: string;
  icon: React.ReactNode;
  adminOnly: boolean;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

interface AdminUser {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "VENDOR";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

interface OrderItem {
  id: string;
  title: string;
  variantTitle: string;
  sku: string;
  price: number;
  quantity: number;
  images: string[];
  status?: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  lineTotal?: number | string;
  refundedAmount?: number | string;
  display?: { code: string; label: string; tone: string };
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; mobile: string; role: string } | null;
}

interface AdminOrder {
  id: string;
  orderNumber: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  total: number;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  shippingLandmark: string | null;
  items: OrderItem[];
  lines?: OrderItem[];
  statusHistory?: StatusHistoryEntry[];
  user: { id: string; name: string | null; mobile: string; email: string | null };
  capturedAmount?: number | string;
  refundedAmount?: number | string;
  display?: { code: string; label: string; tone: string; hint?: string };
  refunds?: { status: string; reason: string; amount: number | string }[];
}

interface OrderMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface NewProductForm {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  images: string;
  isFeatured: boolean;
  isRecommended: boolean;
  variantTitle: string;
  variantSku: string;
  variantPackaging: string;
  variantPrice: string;
  variantStock: string;
}

const emptyForm: NewProductForm = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  images: "",
  isFeatured: false,
  isRecommended: false,
  variantTitle: "",
  variantSku: "",
  variantPackaging: "",
  variantPrice: "",
  variantStock: "0",
};

const PACKAGING_OPTIONS = [
  { value: "GLASS", label: "Glass" },
  { value: "TIN", label: "Tin" },
  { value: "PLASTIC", label: "Plastic / PET" },
  { value: "SPRAY", label: "Spray" },
  { value: "CAN", label: "Can" },
  { value: "POUCH", label: "Pouch / Bag" },
  { value: "BOX", label: "Box / Combo" },
  { value: "OTHER", label: "Other" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bgBadge: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    bgBadge: "bg-amber-500",
    icon: <Clock size={12} />,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    bgBadge: "bg-blue-500",
    icon: <CheckCircle2 size={12} />,
  },
  PAID: {
    label: "Paid",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bgBadge: "bg-emerald-500",
    icon: <CheckCircle2 size={12} />,
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    bgBadge: "bg-purple-500",
    icon: <RefreshCw size={12} />,
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    bgBadge: "bg-cyan-500",
    icon: <Truck size={12} />,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bgBadge: "bg-emerald-600",
    icon: <CheckCircle2 size={12} />,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-50 text-red-600 border-red-200",
    bgBadge: "bg-red-500",
    icon: <XCircle size={12} />,
  },
  REFUNDED: {
    label: "Refunded",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    bgBadge: "bg-slate-500",
    icon: <AlertCircle size={12} />,
  },
};

const PAY_STATUS_CONFIG: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-600 border-red-200",
  PARTIALLY_REFUNDED: "bg-amber-50 text-amber-700 border-amber-200",
  REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_ACTIONS: Record<string, Array<{ to: string; label: string; variant: "primary" | "warn" | "danger" }>> = {
  PENDING: [
    { to: "CONFIRMED", label: "Confirm Order", variant: "primary" },
    { to: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  CONFIRMED: [
    { to: "PROCESSING", label: "Start Processing", variant: "primary" },
    { to: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  PAID: [
    { to: "PROCESSING", label: "Start Processing", variant: "primary" },
    { to: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  PROCESSING: [
    { to: "SHIPPED", label: "Mark as Shipped", variant: "warn" },
    { to: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
  SHIPPED: [
    { to: "DELIVERED", label: "Mark as Delivered", variant: "primary" },
    { to: "DELIVERY_FAILED", label: "Record Delivery Failed", variant: "warn" },
    { to: "CANCELLED", label: "Cancel Order", variant: "danger" },
  ],
};

const ORDER_LIFECYCLE_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

// ── Main Component ─────────────────────────────────────────────

interface AdminContentProps {
  initialTab?: string;
}

export default function AdminContent({ initialTab }: AdminContentProps = {}) {
  const router = useRouter();
  const params = useParams();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const qc = useQueryClient();

  useEffect(() => {
    document.title = "Admin Dashboard | Divantraa Store Operations";
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isStaff = user?.role === "STAFF";
  const canAccess = isAdmin || isStaff;

  // Determine starting tab from URL route or prop
  const routeTab = (params?.tab as string) || initialTab;
  const initialValidTab: AdminTab = (routeTab && VALID_TABS.includes(routeTab as AdminTab))
    ? (routeTab as AdminTab)
    : "overview";

  // Navigation & Layout State
  const [adminTab, setAdminTab] = useState<AdminTab>(initialValidTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Theme State (Dark / Light - Frontend only, persisted in localStorage)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("divantraa_admin_theme") as "light" | "dark" | null;
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      // fallback
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem("divantraa_admin_theme", nextTheme);
    } catch {
      // fallback
    }
  };

  // Sync tab state when URL route changes (e.g. browser Back / Forward)
  useEffect(() => {
    const tabFromUrl = params?.tab as AdminTab | undefined;
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== adminTab) {
      setAdminTab(tabFromUrl);
    }
  }, [params?.tab, adminTab]);

  const switchTab = (tab: AdminTab) => {
    setAdminTab(tab);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      router.push(`/admin/${tab}`, { scroll: false });
    }
  };

  // Products State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewProductForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  // Users State
  const [userMobile, setUserMobile] = useState("");
  const [foundUser, setFoundUser] = useState<AdminUser | null>(null);
  const [userSearchErr, setUserSearchErr] = useState<string | null>(null);
  const [userRoleMsg, setUserRoleMsg] = useState<string | null>(null);

  // Orders State
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ orderId: string; to: string } | null>(null);
  const [shipForm, setShipForm] = useState({ trackingNumber: "", trackingCarrier: "" });
  const [cancelReason, setCancelReason] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => (await api.get<{ data: Product[] }>("/products", { params: { limit: 100 } })).data.data,
    enabled: isAdmin,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["admin-categories"],
    queryFn: async () => (await api.get<{ data: Category[] }>("/categories/active")).data.data,
    enabled: isAdmin,
  });

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<{ data: AdminOrder[]; meta: OrderMeta }>({
    queryKey: ["admin-orders", orderStatus, orderSearch, orderPage],
    queryFn: async () => {
      const params: Record<string, unknown> = { page: orderPage, limit: 25 };
      if (orderStatus) params.status = orderStatus;
      if (orderSearch) params.search = orderSearch;
      return (await api.get("/admin/orders", { params })).data;
    },
    enabled: canAccess,
  });

  const { data: health } = useQuery({
    queryKey: ["admin-pay-health"],
    queryFn: async () => (await api.get("/admin/payments/health")).data.data,
    enabled: canAccess,
    refetchInterval: 60_000,
  });

  // ── Mutations ────────────────────────────────────────────────

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const createProduct = useMutation({
    mutationFn: (payload: object) => api.post("/admin/products", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setShowForm(false);
      setForm(emptyForm);
      setFormError(null);
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
    onError: (err) => { setFoundUser(null); setUserSearchErr(getAxiosErrorMessage(err, "User not found")); },
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
      setActionModal(null);
      setCancelReason("");
      setActionNote("");
      setShipForm({ trackingNumber: "", trackingCarrier: "" });
      setActionError(null);
    },
    onError: (err) => setActionError(getAxiosErrorMessage(err, "Failed to update status")),
  });

  const recordDeliveryFailed = useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note?: string }) =>
      api.post(`/admin/orders/${orderId}/delivery-failed`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setActionModal(null);
      setActionNote("");
      setActionError(null);
    },
    onError: (err) => setActionError(getAxiosErrorMessage(err, "Failed to record delivery failure")),
  });

  // ── Metrics Computed for Executive Overview ───────────────────

  const orders = useMemo(() => ordersData?.data ?? [], [ordersData]);
  const meta = ordersData?.meta;

  const metrics = useMemo(() => {
    let grossRevenue = 0;
    let pendingCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    orders.forEach((o) => {
      if (o.status !== "CANCELLED") {
        grossRevenue += Number(o.total || 0);
      }
      if (o.status === "PENDING" || o.status === "CONFIRMED" || o.status === "PROCESSING") {
        pendingCount += 1;
      }
      if (o.status === "DELIVERED") {
        deliveredCount += 1;
      }
      if (o.status === "CANCELLED") {
        cancelledCount += 1;
      }
    });

    const totalProducts = products?.length ?? 0;
    let totalStockUnits = 0;
    let lowStockCount = 0;

    products?.forEach((p) => {
      const pStock = p.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
      totalStockUnits += pStock;
      if (p.variants.some((v) => v.stock < 15)) {
        lowStockCount += 1;
      }
    });

    return {
      grossRevenue,
      pendingCount,
      deliveredCount,
      cancelledCount,
      totalOrders: meta?.total ?? orders.length,
      totalProducts,
      totalStockUnits,
      lowStockCount,
    };
  }, [orders, meta, products]);

  // ── Helpers ───────────────────────────────────────────────────

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleCreate = () => {
    if (!form.title || !form.slug || !form.description || !form.categoryId || !form.variantSku || !form.variantPrice) {
      setFormError("Title, slug, description, category, variant SKU and price are required.");
      return;
    }
    createProduct.mutate({
      title: form.title,
      slug: form.slug,
      shortDescription: form.shortDescription || undefined,
      description: form.description,
      categoryId: form.categoryId || undefined,
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
      isRecommended: form.isRecommended,
      variants: [
        {
          title: form.variantTitle || "Default",
          options: {},
          sku: form.variantSku,
          packaging: form.variantPackaging || undefined,
          price: parseFloat(form.variantPrice),
          stock: parseInt(form.variantStock, 10) || 0,
          isDefault: true,
          images: [],
        },
      ],
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openAction = (orderId: string, to: string) => {
    setActionModal({ orderId, to });
    setActionError(null);
    setCancelReason("");
    setActionNote("");
    setShipForm({ trackingNumber: "", trackingCarrier: "" });
  };

  const submitAction = () => {
    if (!actionModal) return;
    const { orderId, to } = actionModal;
    if (to === "DELIVERY_FAILED") {
      recordDeliveryFailed.mutate({ orderId, note: actionNote || undefined });
      return;
    }
    const body: Record<string, string> = { status: to };
    if (to === "SHIPPED") {
      if (!shipForm.trackingNumber) {
        setActionError("Tracking number is required");
        return;
      }
      body.trackingNumber = shipForm.trackingNumber;
      body.trackingCarrier = shipForm.trackingCarrier;
    }
    if (to === "CANCELLED") {
      if (!cancelReason) {
        setActionError("Cancellation reason is required");
        return;
      }
      body.cancelReason = cancelReason;
    }
    if (actionNote) body.note = actionNote;
    updateOrderStatus.mutate({ orderId, body });
  };

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const fmtTime = (d: string) =>
    new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const inr = (n: number | string) =>
    `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchesSearch =
        !productSearch ||
        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(productSearch.toLowerCase()));
      const matchesCat = !categoryFilter || p.categoryId === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, productSearch, categoryFilter]);

  // ── Auth Gates ───────────────────────────────────────────────

  if (!user) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <main className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#111C30] rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
              <ShieldOff size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Admin Sign In Required</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Please sign in with your staff or administrator mobile number to access the portal.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full py-3 bg-[#00584B] text-white rounded-2xl text-sm font-semibold hover:bg-[#00483E] transition-all shadow-md"
            >
              Return to Store
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className={theme === "dark" ? "dark" : ""}>
        <main className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#111C30] rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Restricted</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Your current role (<span className="font-semibold text-slate-700 dark:text-slate-300">{user.role}</span>) does not have staff or administrator privileges.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 w-full py-3 bg-[#00584B] text-white rounded-2xl text-sm font-semibold hover:bg-[#00483E] transition-all shadow-md"
            >
              Go to Storefront
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Navigation Items Definition ──────────────────────────────

  const navSections: NavSection[] = [
    {
      group: "MAIN",
      items: [
        { key: "overview" as const, label: "Overview", icon: <LayoutDashboard size={18} />, adminOnly: false },
      ],
    },
    {
      group: "SALES & LOGISTICS",
      items: [
        {
          key: "orders" as const,
          label: "Orders",
          icon: <ShoppingBag size={18} />,
          adminOnly: false,
          badge: metrics.pendingCount > 0 ? metrics.pendingCount : undefined,
          badgeColor: "bg-amber-500",
        },
        { key: "payments" as const, label: "Payments & Refunds", icon: <Wallet size={18} />, adminOnly: false },
        { key: "shipping" as const, label: "Shipping & Fulfillment", icon: <Truck size={18} />, adminOnly: false },
      ],
    },
    {
      group: "STORE CATALOG",
      items: [
        {
          key: "products" as const,
          label: "Products & Stock",
          icon: <Package size={18} />,
          adminOnly: true,
          badge: metrics.lowStockCount > 0 ? `${metrics.lowStockCount} low` : undefined,
          badgeColor: "bg-red-500",
        },
      ],
    },
    {
      group: "SETTINGS & TOOLS",
      items: [
        { key: "users" as const, label: "Customers & Staff", icon: <Users size={18} />, adminOnly: true },
        { key: "notifications" as const, label: "SMS & Notifications", icon: <Bell size={18} />, adminOnly: true },
      ],
    },
  ];

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased selection:bg-[#00584B]/15 transition-colors duration-200">
        
        {/* ═══════════════════════════════════════════════════════════
            LEFT SIDEBAR (Desktop Fixed & Mobile Drawer)
        ═══════════════════════════════════════════════════════════ */}
        {/* Mobile Drawer Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0F1E1B] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } border-r border-[#1B312D]`}
        >
          {/* Brand Header */}
          <div className="p-6 border-b border-[#1B312D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00584B] to-[#008A75] flex items-center justify-center shadow-lg shadow-[#00584B]/20">
                <span className="text-white font-display font-black text-lg">D</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-white text-base tracking-tight">Divantraa</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00584B] text-emerald-200 border border-emerald-500/30">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Store Operational
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
            {navSections.map((section) => {
              const visibleItems = section.items.filter((item) => !item.adminOnly || isAdmin);
              if (!visibleItems.length) return null;

              return (
                <div key={section.group}>
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    {section.group}
                  </p>
                  <div className="space-y-1">
                    {visibleItems.map(({ key, label, icon, badge, badgeColor }) => {
                      const isActive = adminTab === key;
                      return (
                        <button
                          key={key}
                          onClick={() => switchTab(key)}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive
                              ? "bg-[#00584B] text-white shadow-md shadow-[#00584B]/20 font-semibold"
                              : "text-slate-300 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isActive ? "text-emerald-300" : "text-slate-400"}>{icon}</span>
                            <span>{label}</span>
                          </div>
                          {badge && (
                            <span
                              className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${
                                badgeColor || "bg-slate-700"
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User Card & Footer Actions */}
          <div className="p-4 border-t border-[#1B312D] bg-[#0A1614] space-y-3">
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#00584B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {(user.name ?? user.mobile).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name ?? user.mobile}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.role} · Authorized</p>
                </div>
              </div>
              <button
                onClick={() => logout.mutate()}
                title="Sign Out"
                className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>

            <Link
              href="/"
              target="_blank"
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
            >
              <ExternalLink size={13} />
              <span>Open Live Storefront</span>
            </Link>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ═══════════════════════════════════════════════════════════ */}
        <div className="flex-1 md:ml-72 flex flex-col min-w-0">
          
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0E172A]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-4 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <Menu size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span>Admin Console</span>
                  <span>/</span>
                  <span className="capitalize text-slate-700 dark:text-slate-300 font-semibold">{adminTab}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tight hidden sm:block">
                  {adminTab === "overview"
                    ? "Executive Dashboard"
                    : adminTab === "orders"
                    ? "Order Fulfillment & Lifecycle"
                    : adminTab === "products"
                    ? "Product Catalog & Inventory"
                    : adminTab === "payments"
                    ? "Payment Gateway & Refunds"
                    : adminTab === "shipping"
                    ? "Shiprocket & COD Logistics"
                    : adminTab === "notifications"
                    ? "DLT & MSG91 Notifications"
                    : "Customer Directory & Permissions"}
                </h2>
              </div>
            </div>

            {/* Top Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {adminTab === "products" && isAdmin && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setFormError(null);
                  }}
                  className="flex items-center gap-2 bg-[#00584B] text-white rounded-xl px-4 py-2 text-xs font-semibold hover:bg-[#00483E] transition-all shadow-sm shadow-[#00584B]/20"
                >
                  <Plus size={15} />
                  <span>New Product</span>
                </button>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle dark/light mode"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 bg-slate-100/90 hover:bg-slate-200 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 shadow-sm"
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={15} className="text-amber-400" />
                    <span className="hidden md:inline font-mono text-[11px]">Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} className="text-slate-600" />
                    <span className="hidden md:inline font-mono text-[11px]">Dark</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  refetchOrders();
                  refetchProducts();
                }}
                title="Refresh Current Workspace"
                className="p-2 text-slate-500 hover:text-[#00584B] dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700"
              >
                <RefreshCw size={16} />
              </button>

              <Link
                href="/"
                target="_blank"
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700"
              >
                <span>Storefront</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </header>

        {/* Main Body Container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">

          {/* ═══════════════════════════════════════════════════════════
              TAB 1: EXECUTIVE OVERVIEW DASHBOARD
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "overview" && (
            <div className="space-y-8">
              {/* KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Revenue Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-[#00584B]/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Gross Sales</span>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <BarChart3 size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                    {inr(metrics.grossRevenue)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span>{metrics.totalOrders} total orders processed</span>
                  </p>
                </div>

                {/* Orders to Fulfill */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Needs Action</span>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                    {metrics.pendingCount} Orders
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      Pending Fulfillment
                    </span>
                  </div>
                </div>

                {/* Delivered Orders */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Completed</span>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                    {metrics.deliveredCount} Orders
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Delivered successfully</p>
                </div>

                {/* Catalog Inventory Health */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Catalog Health</span>
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Package size={20} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                    {metrics.totalProducts} Products
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {metrics.totalStockUnits} units in stock {metrics.lowStockCount > 0 ? `· ${metrics.lowStockCount} low` : ""}
                  </p>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="bg-gradient-to-r from-[#00584B] to-[#007463] rounded-3xl p-6 text-white shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold font-display">Store Operations Control Center</h3>
                  <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                    Review and dispatch customer orders, monitor real-time Cashfree webhook health, replenish stock, or trigger DLT notification tests.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setOrderStatus("PENDING");
                      switchTab("orders");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white text-[#00584B] text-xs font-bold shadow hover:bg-emerald-50 transition-all"
                  >
                    Fulfill Orders ({metrics.pendingCount})
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        switchTab("products");
                        setShowForm(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-white text-xs font-bold border border-emerald-400/30 transition-all"
                    >
                      + Add Product
                    </button>
                  )}
                  <button
                    onClick={() => switchTab("notifications")}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
                  >
                    Test SMS Gateway
                  </button>
                </div>
              </div>

              {/* 2-Column: Recent Orders Snapshot & Gateway Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Recent Orders</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Latest customer purchases awaiting attention</p>
                    </div>
                    <button
                      onClick={() => switchTab("orders")}
                      className="text-xs font-semibold text-[#00584B] hover:underline flex items-center gap-1"
                    >
                      <span>View all orders</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div className="py-12 text-center text-sm text-slate-400">Loading live orders...</div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400 border border-dashed rounded-2xl">
                      No customer orders placed yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {orders.slice(0, 5).map((order) => {
                        const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
                        return (
                          <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#00584B]">
                                  {order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`}
                                </span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                                {order.user.name ?? order.shippingName} · {order.shippingCity}
                              </p>
                              <p className="text-[10px] text-slate-400">{fmtTime(order.createdAt)}</p>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-slate-900">{inr(order.total)}</p>
                              <button
                                onClick={() => {
                                  setExpandedOrder(order.id);
                                  switchTab("orders");
                                }}
                                className="text-[11px] font-semibold text-[#00584B] hover:underline mt-0.5 inline-block"
                              >
                                Manage →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Gateway & Infrastructure Health (1 col) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Infrastructure Status</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Live connectivity across external APIs</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          CF
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Cashfree Payments</p>
                          <p className="text-[10px] text-slate-500">Auto-verification & webhooks</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        health?.ok !== false ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {health?.ok !== false ? "Operational" : "Degraded"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          SMS
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">MSG91 OTP & Flow</p>
                          <p className="text-[10px] text-slate-500">TRAI DLT Template Engine</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Connected
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          SR
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Shiprocket Logistics</p>
                          <p className="text-[10px] text-slate-500">AWB Tracking & COD</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => switchTab("payments")}
                      className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-center"
                    >
                      View Detailed Payments Health →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 2: ORDERS MANAGEMENT
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "orders" && (
            <div className="space-y-6">
              {/* Filter Tabs & Search Controls */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  {/* Status Pills */}
                  <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { key: "", label: "All Orders" },
                      { key: "PENDING", label: "Pending" },
                      { key: "CONFIRMED", label: "Confirmed" },
                      { key: "PROCESSING", label: "Processing" },
                      { key: "SHIPPED", label: "Shipped" },
                      { key: "DELIVERED", label: "Delivered" },
                      { key: "CANCELLED", label: "Cancelled" },
                    ].map(({ key, label }) => {
                      const isSelected = orderStatus === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setOrderStatus(key);
                            setOrderPage(1);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-[#00584B] text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={orderSearch}
                        onChange={(e) => {
                          setOrderSearch(e.target.value);
                          setOrderPage(1);
                        }}
                        placeholder="Search order #, customer, phone..."
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00584B]/20"
                      />
                    </div>
                    <button
                      onClick={() => refetchOrders()}
                      className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                {meta && (
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                    <span>
                      Showing {orders.length} of {meta.total} order{meta.total !== 1 ? "s" : ""}
                      {orderStatus ? ` · Filtered by ${orderStatus}` : ""}
                    </span>
                    <span>Page {meta.page} of {meta.pages || 1}</span>
                  </div>
                )}
              </div>

              {/* Order Cards List */}
              {ordersLoading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8">
                  <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="text-base font-bold text-slate-700">No Orders Found</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {orderStatus ? `There are no orders with status "${orderStatus}".` : "No orders matching your criteria."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
                    const isOpen = expandedOrder === order.id;
                    const displayId = order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`;
                    const actions = STATUS_ACTIONS[order.status] ?? [];

                    return (
                      <div
                        key={order.id}
                        className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                          isOpen ? "border-[#00584B]/40 shadow-md ring-1 ring-[#00584B]/10" : "border-slate-200/80 shadow-sm hover:border-slate-300"
                        }`}
                      >
                        {/* Summary Header Row */}
                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 items-center">
                            {/* Order ID & Date */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-[#00584B]">{displayId}</span>
                                <button
                                  onClick={() => copyToClipboard(displayId, order.id)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy Order ID"
                                >
                                  {copiedId === order.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                                </button>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">{fmt(order.createdAt)} · {fmtTime(order.createdAt).split(",")[1] ?? ""}</p>
                            </div>

                            {/* Customer Details */}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {order.user.name ?? order.shippingName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{order.user.mobile}</p>
                            </div>

                            {/* Amount & Items */}
                            <div>
                              <p className="text-xs font-bold text-slate-900">{inr(order.total)}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-400">
                                  {(order.lines ?? order.items).length} items
                                </span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PAY_STATUS_CONFIG[order.paymentStatus] ?? PAY_STATUS_CONFIG.PENDING}`}>
                                  {order.paymentMethod}
                                </span>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                {cfg.icon}
                                <span>{order.display?.label ?? cfg.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* Toggle Expand */}
                          <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <button
                              onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                            >
                              <span>{isOpen ? "Collapse" : "Details"}</span>
                              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Drawer */}
                        {isOpen && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-6 space-y-6">
                            
                            {/* Fulfillment Stepper */}
                            {order.status === "CANCELLED" ? (
                              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700">
                                <XCircle size={20} className="shrink-0" />
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-wider">Order Cancelled</p>
                                  <p className="text-xs mt-0.5">{order.cancelReason || "Cancelled by store administrator or customer."}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-white rounded-2xl p-4 border border-slate-200/70">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                                  Fulfillment Stepper
                                </p>
                                <div className="grid grid-cols-5 gap-2 text-center">
                                  {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
                                    const currentIdx = ORDER_LIFECYCLE_STEPS.indexOf(order.status);
                                    const isDone = currentIdx >= idx;
                                    const isCurrent = order.status === step;

                                    return (
                                      <div key={step} className="flex flex-col items-center">
                                        <div
                                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                            isCurrent
                                              ? "bg-[#00584B] text-white ring-4 ring-[#00584B]/20"
                                              : isDone
                                              ? "bg-emerald-100 text-emerald-800"
                                              : "bg-slate-100 text-slate-400"
                                          }`}
                                        >
                                          {isDone && !isCurrent ? <Check size={14} /> : idx + 1}
                                        </div>
                                        <span
                                          className={`text-[10px] font-semibold mt-1.5 capitalize ${
                                            isCurrent ? "text-[#00584B] font-bold" : isDone ? "text-slate-700" : "text-slate-400"
                                          }`}
                                        >
                                          {step.toLowerCase()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 2-Column: Customer Info & Address */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Customer Card */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200/70 space-y-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                  <UserIcon size={12} /> Customer Information
                                </p>
                                <p className="text-sm font-bold text-slate-900">{order.user.name ?? "—"}</p>
                                <p className="text-xs text-slate-600">{order.user.mobile}</p>
                                {order.user.email && <p className="text-xs text-slate-400">{order.user.email}</p>}
                              </div>

                              {/* Delivery Address */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200/70 space-y-1.5">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                                  <MapPin size={12} /> Shipping Address
                                </p>
                                <p className="text-xs font-bold text-slate-900">{order.shippingName} ({order.shippingPhone})</p>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {order.shippingLine1}
                                  {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
                                  <br />
                                  {order.shippingCity}, {order.shippingState} — <span className="font-mono font-semibold">{order.shippingPincode}</span>
                                </p>
                                {order.shippingLandmark && (
                                  <p className="text-[11px] text-slate-400">Landmark: {order.shippingLandmark}</p>
                                )}
                              </div>
                            </div>

                            {/* Tracking Banner if Shipped */}
                            {order.trackingNumber && (
                              <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <Truck size={18} className="text-cyan-700" />
                                  <div>
                                    <p className="text-xs font-bold text-cyan-900">Shipment Tracking</p>
                                    <p className="text-xs font-mono font-semibold text-cyan-800">
                                      {order.trackingNumber} {order.trackingCarrier ? `· via ${order.trackingCarrier}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(order.trackingNumber!, `track-${order.id}`)}
                                  className="text-xs font-semibold text-cyan-700 hover:underline"
                                >
                                  {copiedId === `track-${order.id}` ? "Copied!" : "Copy AWB"}
                                </button>
                              </div>
                            )}

                            {/* Line Items Table */}
                            <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
                              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-800">Order Line Items</p>
                                <span className="text-xs text-slate-400">
                                  {(order.lines ?? order.items).length} items
                                </span>
                              </div>

                              <div className="divide-y divide-slate-100 p-4 space-y-3">
                                {(order.lines ?? order.items).map((item) => {
                                  const cancelled = item.status === "CANCELLED";
                                  const cancellable =
                                    item.status === "PENDING" || item.status === "CONFIRMED" || item.status === "PROCESSING";
                                  const openRefund = item.display?.code === "CANCELLATION_REQUESTED";

                                  return (
                                    <div key={item.id} className={`flex items-start gap-4 pt-3 first:pt-0 ${cancelled ? "opacity-50" : ""}`}>
                                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200/60">
                                        {item.images?.[0] ? (
                                          <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Package size={20} />
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold text-slate-900 ${cancelled ? "line-through" : ""}`}>
                                          {item.title}
                                        </p>
                                        <p className="text-[11px] text-slate-500">{item.variantTitle}</p>
                                        <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>

                                        {isAdmin && cancellable && !openRefund && (order.paymentMethod === "COD" || order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") && (
                                          <CancelLineBox
                                            orderId={order.id}
                                            lineId={item.id}
                                            title={item.title}
                                            onDone={() => {
                                              qc.invalidateQueries({ queryKey: ["admin-orders"] });
                                              qc.invalidateQueries({ queryKey: ["admin-refunds"] });
                                            }}
                                          />
                                        )}
                                      </div>

                                      <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-slate-900">
                                          {inr(item.lineTotal ?? Number(item.price) * item.quantity)}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                          Qty {item.quantity} × {inr(item.price)}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Summary Breakdown */}
                              <div className="bg-slate-50/80 p-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                                <div className="flex justify-between">
                                  <span>Subtotal</span>
                                  <span>{inr(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Shipping Fee</span>
                                  <span>{Number(order.shippingFee) === 0 ? "Free" : inr(order.shippingFee)}</span>
                                </div>
                                {Number(order.codFee) > 0 && (
                                  <div className="flex justify-between">
                                    <span>Cash on Delivery Handling</span>
                                    <span>{inr(order.codFee)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2 text-sm">
                                  <span>Grand Total</span>
                                  <span className="text-[#00584B] font-display">{inr(order.total)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Status Timeline Audit */}
                            {(order.statusHistory?.length ?? 0) > 0 && (
                              <div className="bg-white rounded-2xl p-4 border border-slate-200/70">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 font-mono">
                                  Status Audit Trail
                                </p>
                                <div className="space-y-3">
                                  {(order.statusHistory ?? []).map((h) => {
                                    const c = STATUS_CONFIG[h.status] ?? STATUS_CONFIG.PENDING;
                                    return (
                                      <div key={h.id} className="flex items-start gap-3 text-xs">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${c.color} mt-0.5`}>
                                          {c.icon}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-800">{c.label}</p>
                                          {h.note && <p className="text-slate-500 text-[11px] mt-0.5">{h.note}</p>}
                                          <p className="text-[10px] text-slate-400 mt-0.5">
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

                            {/* Online Payment Refund Trigger */}
                            {isAdmin && order.paymentMethod === "ONLINE" && (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") && (
                              <RefundBox
                                orderId={order.id}
                                total={order.total}
                                captured={order.capturedAmount ?? order.total}
                                refunded={order.refundedAmount ?? 0}
                                onDone={() => {
                                  qc.invalidateQueries({ queryKey: ["admin-orders"] });
                                  qc.invalidateQueries({ queryKey: ["admin-refunds"] });
                                }}
                              />
                            )}

                            {/* Action Buttons */}
                            {actions.length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80">
                                <span className="text-xs font-semibold text-slate-500 mr-2">Update Status:</span>
                                {actions.map((act) => (
                                  <button
                                    key={act.to}
                                    onClick={() => openAction(order.id, act.to)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                      act.variant === "primary"
                                        ? "bg-[#00584B] text-white hover:bg-[#00483E]"
                                        : act.variant === "warn"
                                        ? "bg-cyan-600 text-white hover:bg-cyan-700"
                                        : "border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                                    }`}
                                  >
                                    {act.label}
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
              )}

              {/* Pagination */}
              {meta && meta.pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={orderPage === 1}
                    className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs font-medium text-slate-500">
                    Page {orderPage} of {meta.pages}
                  </span>
                  <button
                    onClick={() => setOrderPage((p) => Math.min(meta.pages, p + 1))}
                    disabled={orderPage === meta.pages}
                    className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 3: PRODUCTS & CATALOG
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "products" && isAdmin && (
            <div className="space-y-6">
              {/* Add Product Modal Form */}
              {showForm && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-display">Create New Product</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Fill in product details and initial stock variant</p>
                    </div>
                    <button
                      onClick={() => setShowForm(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Product Title *">
                      <input
                        value={form.title}
                        onChange={(e) => {
                          const t = e.target.value;
                          setForm((f) => ({ ...f, title: t, slug: handleSlug(t) }));
                        }}
                        placeholder="A2 Desi Cow Bilona Ghee"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="URL Slug *">
                      <input
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        placeholder="a2-desi-cow-bilona-ghee"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Short Teaser Description">
                      <input
                        value={form.shortDescription}
                        onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                        placeholder="Traditional bilona churned golden ghee"
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Product Category *">
                      <select
                        value={form.categoryId}
                        onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="">— Select Category —</option>
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {"— ".repeat(c.level)}
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Full Description *" className="sm:col-span-2">
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                        placeholder="Comprehensive details, ingredients, and health benefits..."
                        className={inputCls}
                      />
                    </Field>

                    <Field label="Images (Comma-separated URLs)" className="sm:col-span-2">
                      <input
                        value={form.images}
                        onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                        placeholder="https://.../ghee-1.jpg, https://.../ghee-2.jpg"
                        className={inputCls}
                      />
                    </Field>

                    {/* Initial Variant Fields */}
                    <div className="sm:col-span-2 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                        Initial Stock Variant
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <Field label="Variant Title">
                          <input
                            value={form.variantTitle}
                            onChange={(e) => setForm((f) => ({ ...f, variantTitle: e.target.value }))}
                            placeholder="500 ml Glass Jar"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Base SKU *">
                          <input
                            value={form.variantSku}
                            onChange={(e) => setForm((f) => ({ ...f, variantSku: e.target.value }))}
                            placeholder="GHEE-A2-500"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Packaging">
                          <select
                            value={form.variantPackaging}
                            onChange={(e) => setForm((f) => ({ ...f, variantPackaging: e.target.value }))}
                            className={inputCls}
                          >
                            <option value="">— Standard —</option>
                            {PACKAGING_OPTIONS.map((p) => (
                              <option key={p.value} value={p.value}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Price (₹) *">
                          <input
                            type="number"
                            min="0"
                            value={form.variantPrice}
                            onChange={(e) => setForm((f) => ({ ...f, variantPrice: e.target.value }))}
                            placeholder="899"
                            className={inputCls}
                          />
                        </Field>
                        <Field label="Initial Stock Units">
                          <input
                            type="number"
                            min="0"
                            value={form.variantStock}
                            onChange={(e) => setForm((f) => ({ ...f, variantStock: e.target.value }))}
                            placeholder="100"
                            className={inputCls}
                          />
                        </Field>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:col-span-2 pt-2">
                      <input
                        id="isFeatured"
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                        className="rounded border-slate-300 text-[#00584B] focus:ring-[#00584B]"
                      />
                      <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-800">
                        Feature on Homepage Best Sellers
                      </label>
                    </div>

                    <div className="flex items-center gap-3 sm:col-span-2">
                      <input
                        id="isRecommended"
                        type="checkbox"
                        checked={form.isRecommended}
                        onChange={(e) => setForm((f) => ({ ...f, isRecommended: e.target.checked }))}
                        className="rounded border-slate-300 text-[#00584B] focus:ring-[#00584B]"
                      />
                      <label htmlFor="isRecommended" className="text-xs font-semibold text-slate-800">
                        Recommend as Add-On (Suggested in Cart Drawer)
                      </label>
                    </div>
                  </div>

                  {formError && <p className="text-xs text-red-600 font-semibold">{formError}</p>}

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleCreate}
                      disabled={createProduct.isPending}
                      className="px-6 py-2.5 rounded-xl bg-[#00584B] text-white text-xs font-bold hover:bg-[#00483E] transition-all flex items-center gap-2 shadow"
                    >
                      {createProduct.isPending && <RefreshCw size={13} className="animate-spin" />}
                      <span>Save & Publish Product</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setFormError(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Product Search & Category Bar */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search title, SKU, slug..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00584B]/20"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-[#00584B] text-white rounded-xl text-xs font-semibold hover:bg-[#00483E] transition-all flex items-center gap-2 shrink-0 shadow-sm"
                >
                  <Plus size={15} />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Products List */}
              {productsLoading ? (
                <div className="py-20 text-center text-sm text-slate-400">Loading catalog...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8">
                  <Package size={40} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="text-base font-bold text-slate-700">No Products Found</h4>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting your search or category filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => {
                    const totalUnits = product.variants.reduce((sum, v) => sum + v.stock, 0);
                    const isExpanded = expanded.has(product.id);

                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:border-slate-300 transition-all"
                      >
                        <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200/60">
                              {product.images[0] ? (
                                <Image src={product.images[0]} alt={product.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Package size={22} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 truncate">{product.title}</h4>
                                {product.isFeatured && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                    Featured
                                  </span>
                                )}
                                {product.isRecommended && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Add-on
                                  </span>
                                )}
                                {!product.isActive && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                                /{product.slug} · {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right hidden sm:block">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                  totalUnits > 20
                                    ? "bg-emerald-50 text-emerald-700"
                                    : totalUnits > 0
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {totalUnits} Units in Stock
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggle(product.id)}
                                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors"
                                title="Manage Variants"
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Deactivate product "${product.title}"?`)) {
                                    deleteProduct.mutate(product.id);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                                title="Deactivate"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Variant Management Table */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-6">
                            <VariantTable product={product} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 4: PAYMENTS & HEALTH
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "payments" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <PaymentsPanel isAdmin={isAdmin} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 5: SHIPPING & COD
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "shipping" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <ShippingPanel isAdmin={isAdmin} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 6: NOTIFICATIONS & MSG91
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "notifications" && isAdmin && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <NotificationsPanel isAdmin={isAdmin} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              TAB 7: USERS & PERMISSIONS
          ═══════════════════════════════════════════════════════════ */}
          {adminTab === "users" && isAdmin && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Customer & Staff Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Look up customers by phone number, check order histories, or manage access permissions.
                  </p>
                </div>

                {/* Role Explainer Banner */}
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl text-xs text-emerald-950 space-y-2">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <ShieldCheck size={14} /> Role Permissions Structure
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/40">
                      <span className="font-bold text-[#00584B]">CUSTOMER</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Standard shoppers. Can cart & checkout.</p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/40">
                      <span className="font-bold text-purple-700">STAFF</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Can inspect & fulfill customer orders.</p>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200/40">
                      <span className="font-bold text-amber-700">ADMIN</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">Full root access including products & roles.</p>
                    </div>
                  </div>
                </div>

                {/* Lookup Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={userMobile}
                      onChange={(e) => setUserMobile(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchUser.mutate(userMobile)}
                      placeholder="+91XXXXXXXXXX or 10-digit customer mobile number"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00584B]/20"
                    />
                  </div>
                  <button
                    onClick={() => searchUser.mutate(userMobile)}
                    disabled={searchUser.isPending || !userMobile}
                    className="px-5 py-2.5 bg-[#00584B] text-white rounded-xl text-xs font-semibold hover:bg-[#00483E] transition-all flex items-center gap-2 disabled:opacity-40 shadow-sm"
                  >
                    {searchUser.isPending ? <RefreshCw size={13} className="animate-spin" /> : <Search size={14} />}
                    <span>Lookup</span>
                  </button>
                </div>

                {userSearchErr && <p className="text-xs text-red-600 font-semibold">{userSearchErr}</p>}
                {userRoleMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
                    {userRoleMsg}
                  </div>
                )}

                {/* User Record Card */}
                {foundUser && (
                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{foundUser.name ?? "Customer Account"}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              foundUser.role === "ADMIN"
                                ? "bg-amber-100 text-amber-800"
                                : foundUser.role === "STAFF"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {foundUser.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">{foundUser.mobile}</p>
                        {foundUser.email && <p className="text-xs text-slate-400">{foundUser.email}</p>}
                      </div>

                      {/* Action Roles */}
                      <div className="flex flex-wrap items-center gap-2">
                        {foundUser.role !== "ADMIN" && (
                          <button
                            onClick={() => changeRole.mutate({ id: foundUser.id, role: "ADMIN" })}
                            disabled={changeRole.isPending}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                          >
                            <ShieldCheck size={14} /> Promote to ADMIN
                          </button>
                        )}
                        {foundUser.role === "ADMIN" && (
                          <button
                            onClick={() => changeRole.mutate({ id: foundUser.id, role: "CUSTOMER" })}
                            disabled={changeRole.isPending}
                            className="px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold transition-all flex items-center gap-1.5"
                          >
                            <ShieldOff size={14} /> Remove ADMIN
                          </button>
                        )}
                        {foundUser.role !== "STAFF" && (
                          <button
                            onClick={() => changeRole.mutate({ id: foundUser.id, role: "STAFF" })}
                            disabled={changeRole.isPending}
                            className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-all"
                          >
                            Set as STAFF
                          </button>
                        )}
                        {foundUser.role !== "CUSTOMER" && (
                          <button
                            onClick={() => changeRole.mutate({ id: foundUser.id, role: "CUSTOMER" })}
                            disabled={changeRole.isPending}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
                          >
                            Set as CUSTOMER
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ACTION MODAL (Confirm / Ship / Cancel / Delivery Failed)
      ═══════════════════════════════════════════════════════════ */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setActionModal(null);
              setActionError(null);
            }}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-7 z-10 border border-slate-100 space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-display">
                {actionModal.to === "CANCELLED"
                  ? "Cancel Order"
                  : actionModal.to === "SHIPPED"
                  ? "Dispatch & Ship Order"
                  : actionModal.to === "DELIVERY_FAILED"
                  ? "Record Delivery Attempt Failed"
                  : `Confirm Transition: ${STATUS_CONFIG[actionModal.to]?.label ?? actionModal.to}`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Please provide any required fulfillment notes.</p>
            </div>

            {/* Delivery Failed Info */}
            {actionModal.to === "DELIVERY_FAILED" && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-800">
                    <AlertCircle size={14} /> SMS Notification Alert
                  </p>
                  Customer will automatically receive the <strong>Divantraa-Delivery-Failed</strong> SMS letting them know our courier will retry shortly.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Courier Note (Optional)</label>
                  <input
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="e.g. Customer unavailable, door locked, phone unreachable"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Shipping Form */}
            {actionModal.to === "SHIPPED" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tracking Number / AWB *</label>
                  <input
                    value={shipForm.trackingNumber}
                    onChange={(e) => setShipForm((f) => ({ ...f, trackingNumber: e.target.value }))}
                    placeholder="e.g. 12984712894"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics Carrier (Optional)</label>
                  <input
                    value={shipForm.trackingCarrier}
                    onChange={(e) => setShipForm((f) => ({ ...f, trackingCarrier: e.target.value }))}
                    placeholder="e.g. BlueDart, Delhivery, Shiprocket"
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Cancel Reason */}
            {actionModal.to === "CANCELLED" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested, stock deficit, pincode non-serviceable"
                  rows={3}
                  className={inputCls}
                />
              </div>
            )}

            {/* Internal Note */}
            {actionModal.to !== "CANCELLED" && actionModal.to !== "SHIPPED" && actionModal.to !== "DELIVERY_FAILED" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Note (Optional)</label>
                <input
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Internal note for this status change"
                  className={inputCls}
                />
              </div>
            )}

            {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={submitAction}
                disabled={updateOrderStatus.isPending || recordDeliveryFailed.isPending}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                  actionModal.to === "CANCELLED"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : actionModal.to === "DELIVERY_FAILED"
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-[#00584B] text-white hover:bg-[#00483E]"
                }`}
              >
                {(updateOrderStatus.isPending || recordDeliveryFailed.isPending) && (
                  <RefreshCw size={14} className="animate-spin" />
                )}
                <span>
                  {actionModal.to === "CANCELLED"
                    ? "Cancel Order"
                    : actionModal.to === "DELIVERY_FAILED"
                    ? "Record & Send SMS"
                    : "Confirm Transition"}
                </span>
              </button>
              <button
                onClick={() => {
                  setActionModal(null);
                  setActionError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// ── Form Helper ────────────────────────────────────────────────

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full bg-slate-50 dark:bg-[#0E1628] border border-slate-200/90 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00584B]/20 dark:focus:ring-emerald-500/20 focus:border-[#00584B] dark:focus:border-emerald-600 transition-all";

