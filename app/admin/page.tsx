"use client";

/**
 * app/admin/page.tsx
 * Basic admin panel — product management.
 *
 * Access control: restricted to users with role === "ADMIN".
 * Calls the existing backend admin routes at /api/v1/admin/...
 *
 * Rules-of-Hooks fix: ALL hooks are called unconditionally at the top.
 * Auth-gate returns come after every hook call.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package, ChevronDown, ChevronUp, RefreshCw, Users, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Product } from "@/types/product";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

// ── Minimal user shape returned from admin user endpoints ──────
interface AdminUser {
  id:     string;
  mobile: string;
  name:   string | null;
  email:  string | null;
  role:   "CUSTOMER" | "ADMIN" | "STAFF" | "VENDOR";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

// ── Types ─────────────────────────────────────────────────────

interface NewProductForm {
  title:            string;
  slug:             string;
  shortDescription: string;
  description:      string;
  categoryId:       string;
  images:           string;
  isFeatured:       boolean;
  variantTitle:     string;
  variantSku:       string;
  variantPrice:     string;
  variantStock:     string;
}

const emptyForm: NewProductForm = {
  title: "", slug: "", shortDescription: "", description: "",
  categoryId: "", images: "", isFeatured: false,
  variantTitle: "", variantSku: "", variantPrice: "", variantStock: "0",
};

// ── Component ─────────────────────────────────────────────────

export default function AdminPage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const qc      = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  // ── All hooks called unconditionally (Rules of Hooks) ─────────
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<NewProductForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());
  const [stockEdit, setStockEdit] = useState<Record<string, string>>({});

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn:  async () =>
      (await api.get<{ data: Product[] }>("/products", { params: { limit: 50 } })).data.data,
    enabled: isAdmin,   // won't fetch if not admin
  });

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
      setShowForm(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (err) => setFormError(getAxiosErrorMessage(err, "Failed to create product")),
  });

  // ── User management state ─────────────────────────────────────
  const [userMobile,    setUserMobile]    = useState("");
  const [foundUser,     setFoundUser]     = useState<AdminUser | null>(null);
  const [userSearchErr, setUserSearchErr] = useState<string | null>(null);
  const [userRoleMsg,   setUserRoleMsg]   = useState<string | null>(null);

  const searchUser = useMutation({
    mutationFn: async (mobile: string) => {
      const normalized = mobile.startsWith("+") ? mobile : `+91${mobile}`;
      const res = await api.get<{ user: AdminUser }>("/admin/users/search", {
        params: { mobile: normalized },
      });
      return res.data.user;
    },
    onSuccess: (u) => { setFoundUser(u); setUserSearchErr(null); },
    onError:   (err) => { setFoundUser(null); setUserSearchErr(getAxiosErrorMessage(err, "User not found")); },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: AdminUser["role"] }) =>
      api.patch<{ user: AdminUser }>(`/admin/users/${id}/role`, { role }),
    onSuccess: (res) => {
      const updated = res.data.user;
      setFoundUser(updated);
      setUserRoleMsg(`Role changed to ${updated.role}. User's sessions revoked — they must log in again.`);
      setTimeout(() => setUserRoleMsg(null), 5000);
    },
    onError: (err) => setUserSearchErr(getAxiosErrorMessage(err, "Failed to change role")),
  });

  // ── Auth gates — safe now that all hooks are above ────────────

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-ink/60">Please sign in to access the admin panel.</p>
        <button onClick={() => router.push("/")} className="mt-4 text-sm text-leaf hover:underline">
          Go home
        </button>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <p className="text-ink/60 text-lg">Access denied.</p>
        <p className="text-sm text-ink/40 mt-1">
          Your account (role: {user.role}) does not have admin privileges.
        </p>
        <button onClick={() => router.push("/")} className="mt-4 text-sm text-leaf hover:underline">
          Go home
        </button>
      </main>
    );
  }

  // ── Helpers ───────────────────────────────────────────────────

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCreate = () => {
    if (!form.title || !form.slug || !form.description || !form.variantSku || !form.variantPrice) {
      setFormError("Title, slug, description, variant SKU and price are required.");
      return;
    }
    createProduct.mutate({
      title:            form.title,
      slug:             form.slug,
      shortDescription: form.shortDescription || undefined,
      description:      form.description,
      categoryId:       form.categoryId || undefined,
      images:           form.images.split(",").map((s) => s.trim()).filter(Boolean),
      isFeatured:       form.isFeatured,
      variants: [{
        title:     form.variantTitle || "Default",
        options:   {},
        sku:       form.variantSku,
        price:     parseFloat(form.variantPrice),
        stock:     parseInt(form.variantStock, 10) || 0,
        isDefault: true,
        images:    [],
      }],
    });
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Admin Panel</h1>
          <p className="text-sm text-ink/50 mt-1">
            {user.name ?? user.mobile} · {user.role}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(null); }}
          className="flex items-center gap-2 bg-leaf text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* New product form */}
      {showForm && (
        <div className="bg-white border border-ink/10 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-ink mb-5">Create product</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Title *">
              <input
                value={form.title}
                onChange={(e) => {
                  const t = e.target.value;
                  setForm((f) => ({ ...f, title: t, slug: handleSlug(t) }));
                }}
                placeholder="A2 Cow Bilona Ghee"
                className={inputCls}
              />
            </Field>
            <Field label="Slug *">
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="a2-cow-bilona-ghee"
                className={inputCls}
              />
            </Field>
            <Field label="Short description">
              <input
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                placeholder="One-line teaser shown on cards"
                className={inputCls}
              />
            </Field>
            <Field label="Category ID">
              <input
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                placeholder="UUID from /api/v1/categories"
                className={inputCls}
              />
            </Field>
            <Field label="Description *" className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Full product description"
                className={inputCls}
              />
            </Field>
            <Field label="Images (comma-separated URLs)" className="sm:col-span-2">
              <input
                value={form.images}
                onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                placeholder="https://…/img1.jpg, https://…/img2.jpg"
                className={inputCls}
              />
            </Field>

            {/* Initial variant */}
            <div className="sm:col-span-2 border-t border-ink/10 pt-4">
              <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">
                Initial variant
              </p>
              <div className="grid sm:grid-cols-4 gap-4">
                <Field label="Variant title">
                  <input
                    value={form.variantTitle}
                    onChange={(e) => setForm((f) => ({ ...f, variantTitle: e.target.value }))}
                    placeholder="500 ml Glass Jar"
                    className={inputCls}
                  />
                </Field>
                <Field label="SKU *">
                  <input
                    value={form.variantSku}
                    onChange={(e) => setForm((f) => ({ ...f, variantSku: e.target.value }))}
                    placeholder="GHEE-A2-500-G"
                    className={inputCls}
                  />
                </Field>
                <Field label="Price (₹) *">
                  <input
                    type="number" min="0"
                    value={form.variantPrice}
                    onChange={(e) => setForm((f) => ({ ...f, variantPrice: e.target.value }))}
                    placeholder="899"
                    className={inputCls}
                  />
                </Field>
                <Field label="Stock">
                  <input
                    type="number" min="0"
                    value={form.variantStock}
                    onChange={(e) => setForm((f) => ({ ...f, variantStock: e.target.value }))}
                    placeholder="100"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="isFeatured" type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="rounded border-ink/20"
              />
              <label htmlFor="isFeatured" className="text-sm text-ink">Mark as featured</label>
            </div>
          </div>

          {formError && <p className="mt-3 text-sm text-red-500">{formError}</p>}

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleCreate}
              disabled={createProduct.isPending}
              className="bg-leaf text-white rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {createProduct.isPending && <RefreshCw size={14} className="animate-spin" />}
              Create product
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="border border-ink/20 rounded-xl px-5 py-2 text-sm text-ink/60 hover:border-ink/40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      {isLoading && (
        <div className="text-ink/40 py-12 text-center">Loading products…</div>
      )}

      {!isLoading && products?.length === 0 && (
        <div className="text-center py-16">
          <Package size={40} className="mx-auto text-ink/20 mb-3" />
          <p className="text-ink/40">No products yet. Create one above.</p>
        </div>
      )}

      <div className="space-y-3">
        {products?.map((product) => (
          <div key={product.id} className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-sm">

            {/* Product row */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="h-12 w-12 rounded-xl bg-ink/5 overflow-hidden relative shrink-0">
                {product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink truncate">{product.title}</p>
                  {product.isFeatured && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                      Featured
                    </span>
                  )}
                  {!product.isActive && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink/40 mt-0.5">
                  {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                  {" · "}
                  {product.variants.reduce((s, v) => s + v.stock, 0)} units in stock
                  {" · "}
                  <span className="font-mono text-ink/30 text-[11px]">{product.slug}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggle(product.id)}
                  className="text-ink/40 hover:text-ink transition-colors p-1"
                  aria-label="Toggle variants"
                >
                  {expanded.has(product.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Deactivate "${product.title}"?`)) {
                      deleteProduct.mutate(product.id);
                    }
                  }}
                  className="text-ink/30 hover:text-red-500 transition-colors p-1"
                  aria-label="Deactivate product"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Variants (expandable) */}
            {expanded.has(product.id) && (
              <div className="border-t border-ink/5 bg-ink/[0.02]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-ink/40 border-b border-ink/5">
                        <th className="text-left px-5 py-2 font-medium">Variant</th>
                        <th className="text-left px-5 py-2 font-medium">SKU</th>
                        <th className="text-right px-5 py-2 font-medium">Price</th>
                        <th className="text-right px-5 py-2 font-medium">Stock</th>
                        <th className="text-right px-5 py-2 font-medium w-36">Set stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((variant) => (
                        <tr key={variant.id} className="border-b border-ink/5 last:border-0">
                          <td className="px-5 py-2.5 text-ink/80">
                            {variant.title}
                            {variant.isDefault && (
                              <span className="ml-1.5 text-xs text-leaf">(default)</span>
                            )}
                          </td>
                          <td className="px-5 py-2.5 font-mono text-xs text-ink/50">{variant.sku}</td>
                          <td className="px-5 py-2.5 text-right">₹{Number(variant.price)}</td>
                          <td className="px-5 py-2.5 text-right">
                            <span className={
                              variant.stock === 0 ? "text-red-500"
                              : variant.stock <= (variant.lowStockAlert ?? 5) ? "text-amber-500"
                              : "text-green-600"
                            }>
                              {variant.stock}
                            </span>
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number" min="0"
                                value={stockEdit[variant.id] ?? ""}
                                onChange={(e) =>
                                  setStockEdit((prev) => ({ ...prev, [variant.id]: e.target.value }))
                                }
                                placeholder={String(variant.stock)}
                                className="w-16 border border-ink/15 rounded-lg px-2 py-1 text-xs text-right"
                              />
                              <button
                                onClick={() => {
                                  const val = parseInt(stockEdit[variant.id] ?? "", 10);
                                  if (!isNaN(val)) {
                                    adjustStock.mutate({ variantId: variant.id, value: val });
                                    setStockEdit((prev) => {
                                      const next = { ...prev };
                                      delete next[variant.id];
                                      return next;
                                    });
                                  }
                                }}
                                className="text-leaf hover:text-leaf/70 text-xs font-medium"
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── User Management ───────────────────────────────────── */}
      <div className="mt-10 bg-white border border-ink/10 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Users size={18} className="text-leaf" />
          <h2 className="font-semibold text-ink">User Management</h2>
        </div>

        {/* How roles work — context box */}
        <div className="mb-5 p-4 bg-leaf/5 border border-leaf/15 rounded-xl text-sm text-ink/70 leading-relaxed">
          <p className="font-medium text-ink mb-1">How roles work</p>
          <ul className="space-y-1 text-xs">
            <li><span className="font-mono bg-ink/5 px-1 rounded">CUSTOMER</span> — default; can shop, cart, checkout, write reviews</li>
            <li><span className="font-mono bg-ink/5 px-1 rounded">ADMIN</span> — everything a CUSTOMER can do <strong>plus</strong> full admin panel access</li>
            <li><span className="font-mono bg-ink/5 px-1 rounded">STAFF</span> — reserved for future limited-access roles</li>
            <li><span className="font-mono bg-ink/5 px-1 rounded">VENDOR</span> — reserved for future vendor portal</li>
          </ul>
          <p className="mt-2 text-xs text-ink/50">
            One mobile = one account. An ADMIN user can shop normally AND manage products.
            No second account needed.
          </p>
        </div>

        {/* Search by mobile */}
        <div className="flex gap-2 mb-4">
          <input
            value={userMobile}
            onChange={(e) => setUserMobile(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchUser.mutate(userMobile)}
            placeholder="+91XXXXXXXXXX or 10-digit number"
            className={inputCls + " flex-1"}
          />
          <button
            onClick={() => searchUser.mutate(userMobile)}
            disabled={searchUser.isPending || !userMobile}
            className="flex items-center gap-2 bg-ink text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40"
          >
            {searchUser.isPending
              ? <RefreshCw size={14} className="animate-spin" />
              : <Search size={14} />}
            Search
          </button>
        </div>

        {userSearchErr && (
          <p className="text-sm text-red-500 mb-3">{userSearchErr}</p>
        )}

        {userRoleMsg && (
          <div className="mb-3 rounded-lg bg-leaf/10 border border-leaf/20 text-leaf text-sm px-4 py-2.5">
            {userRoleMsg}
          </div>
        )}

        {/* Found user card */}
        {foundUser && (
          <div className="border border-ink/10 rounded-xl p-4 bg-ink/[0.02]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-ink">{foundUser.name ?? <span className="text-ink/40">No name</span>}</p>
                <p className="text-sm text-ink/60">{foundUser.mobile}</p>
                {foundUser.email && <p className="text-xs text-ink/40">{foundUser.email}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    foundUser.role === "ADMIN"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-ink/5 text-ink/60"
                  }`}>
                    {foundUser.role}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    foundUser.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {foundUser.status}
                  </span>
                </div>
              </div>

              {/* Role change buttons */}
              <div className="flex flex-col gap-2">
                {foundUser.role !== "ADMIN" ? (
                  <button
                    onClick={() => changeRole.mutate({ id: foundUser.id, role: "ADMIN" })}
                    disabled={changeRole.isPending}
                    className="flex items-center gap-2 bg-amber-500 text-white rounded-lg px-4 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} />
                    Promote to ADMIN
                  </button>
                ) : (
                  <button
                    onClick={() => changeRole.mutate({ id: foundUser.id, role: "CUSTOMER" })}
                    disabled={changeRole.isPending}
                    className="flex items-center gap-2 border border-ink/20 text-ink/60 rounded-lg px-4 py-2 text-xs font-medium hover:border-red-300 hover:text-red-500 disabled:opacity-50"
                  >
                    <ShieldOff size={14} />
                    Remove ADMIN → CUSTOMER
                  </button>
                )}
                {foundUser.role !== "STAFF" && (
                  <button
                    onClick={() => changeRole.mutate({ id: foundUser.id, role: "STAFF" })}
                    disabled={changeRole.isPending}
                    className="flex items-center gap-2 border border-ink/20 text-ink/60 rounded-lg px-4 py-2 text-xs font-medium hover:border-ink/40 disabled:opacity-50"
                  >
                    Set as STAFF
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-ink/30 mt-3 font-mono">id: {foundUser.id}</p>
          </div>
        )}
      </div>

      {/* Admin API reference */}
      <div className="mt-10 p-5 bg-ink/[0.03] rounded-2xl border border-ink/10">
        <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">
          Backend admin routes (all require ADMIN role)
        </p>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono text-ink/50">
          <span>POST   /api/v1/admin/products</span>
          <span>PATCH  /api/v1/admin/products/:id</span>
          <span>DELETE /api/v1/admin/products/:id</span>
          <span>POST   /api/v1/admin/products/:id/variants</span>
          <span>PATCH  /api/v1/admin/variants/:id</span>
          <span>DELETE /api/v1/admin/variants/:id</span>
          <span>PATCH  /api/v1/admin/variants/:id/stock</span>
          <span>GET    /api/v1/admin/users/search?mobile=…</span>
          <span>PATCH  /api/v1/admin/users/:id/status</span>
          <span>PATCH  /api/v1/admin/users/:id/role</span>
        </div>
      </div>
    </main>
  );
}

// ── Small helpers ──────────────────────────────────────────────

function Field({
  label, children, className = "",
}: {
  label: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-ink/60 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-ink/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leaf/30 bg-white";
