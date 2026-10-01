"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";
import type { Product, ProductVariant, PackagingType } from "@/types/product";

// ── Packaging: mirrors PACKAGING_SUFFIX in product.controller.ts ────────────

const PACKAGING_OPTIONS: { value: PackagingType; label: string; suffix: string }[] = [
  { value: "GLASS",   label: "Glass",         suffix: "GLS" },
  { value: "TIN",     label: "Tin",           suffix: "TIN" },
  { value: "PLASTIC", label: "Plastic / PET", suffix: "PET" },
  { value: "SPRAY",   label: "Spray",         suffix: "SPR" },
  { value: "CAN",     label: "Can",           suffix: "CAN" },
  { value: "POUCH",   label: "Pouch / Bag",   suffix: "PCH" },
  { value: "BOX",     label: "Box / Combo",   suffix: "BOX" },
  { value: "OTHER",   label: "Other",         suffix: "OTH" },
];

/** Client-side preview only — the server is the source of truth and enforces this itself. */
function previewSku(base: string, packaging: PackagingType | ""): string {
  if (!base || !packaging) return base;
  const suffix = PACKAGING_OPTIONS.find((p) => p.value === packaging)!.suffix;
  return new RegExp(`(-|_)${suffix}$`, "i").test(base) ? base : `${base}-${suffix}`;
}

interface VariantFormState {
  title:           string;
  sku:             string;
  packaging:       PackagingType | "";
  price:           string;
  compareAtPrice:  string;
  stock:           string;
  unitQuantity:    string;
  unitLabel:       string;
  optionSizeKey:   string;
  optionSizeValue: string;
  optionContainer: string;
  isDefault:       boolean;
}

const emptyVariantForm: VariantFormState = {
  title: "", sku: "", packaging: "", price: "", compareAtPrice: "", stock: "0",
  unitQuantity: "", unitLabel: "", optionSizeKey: "Size", optionSizeValue: "",
  optionContainer: "", isDefault: false,
};

function toVariantForm(v: ProductVariant): VariantFormState {
  const { Size, Weight, Container, ...restOptions } = v.options ?? {};
  const sizeKey = Weight !== undefined ? "Weight" : "Size";
  return {
    title: v.title, sku: v.sku, packaging: v.packaging ?? "",
    price: String(v.price), compareAtPrice: v.compareAtPrice != null ? String(v.compareAtPrice) : "",
    stock: String(v.stock), unitQuantity: v.unitQuantity != null ? String(v.unitQuantity) : "",
    unitLabel: v.unitLabel ?? "", optionSizeKey: sizeKey, optionSizeValue: Size ?? Weight ?? "",
    optionContainer: Container ?? Object.values(restOptions)[0] ?? "", isDefault: v.isDefault,
  };
}

function buildPayload(f: VariantFormState) {
  const options: Record<string, string> = {};
  if (f.optionSizeValue) options[f.optionSizeKey || "Size"] = f.optionSizeValue;
  if (f.optionContainer) options.Container = f.optionContainer;
  return {
    title: f.title, sku: f.sku, packaging: f.packaging || undefined,
    price: parseFloat(f.price), compareAtPrice: f.compareAtPrice ? parseFloat(f.compareAtPrice) : undefined,
    stock: parseInt(f.stock, 10) || 0, unitQuantity: f.unitQuantity ? parseFloat(f.unitQuantity) : undefined,
    unitLabel: f.unitLabel || undefined, options, isDefault: f.isDefault,
  };
}

const inputCls =
  "w-full border border-ink/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-leaf/30 bg-white";

function VariantFields({ form, setForm }: { form: VariantFormState; setForm: (f: VariantFormState) => void }) {
  return (
    <div className="grid sm:grid-cols-4 gap-2.5">
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Title *</label>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="500ml Glass Jar" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Base SKU *</label>
        <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
          placeholder="OIL-AL-500" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Packaging</label>
        <select value={form.packaging} onChange={(e) => setForm({ ...form, packaging: e.target.value as PackagingType | "" })}
          className={inputCls}>
          <option value="">— none —</option>
          {PACKAGING_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Final SKU (preview)</label>
        <div className={inputCls + " bg-ink/[0.03] text-ink/50 font-mono truncate"}>{previewSku(form.sku, form.packaging) || "—"}</div>
      </div>

      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Price (₹) *</label>
        <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="899" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Compare-at (₹)</label>
        <input type="number" min="0" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
          placeholder="999" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Stock</label>
        <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
          placeholder="100" className={inputCls} />
      </div>
      <div className="flex items-end pb-1.5">
        <label className="flex items-center gap-1.5 text-xs text-ink/60">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="rounded border-ink/20" /> Default variant
        </label>
      </div>

      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Unit qty (for ₹/L etc.)</label>
        <input type="number" min="0" step="0.001" value={form.unitQuantity} onChange={(e) => setForm({ ...form, unitQuantity: e.target.value })}
          placeholder="0.5" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Unit label</label>
        <input value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
          placeholder="L, kg, g…" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Size / Weight</label>
        <div className="flex gap-1">
          <select value={form.optionSizeKey} onChange={(e) => setForm({ ...form, optionSizeKey: e.target.value })}
            className={inputCls + " w-20 shrink-0"}>
            <option value="Size">Size</option>
            <option value="Weight">Weight</option>
          </select>
          <input value={form.optionSizeValue} onChange={(e) => setForm({ ...form, optionSizeValue: e.target.value })}
            placeholder="500ml" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink/50 mb-0.5">Container (option label)</label>
        <input value={form.optionContainer} onChange={(e) => setForm({ ...form, optionContainer: e.target.value })}
          placeholder="Glass Jar" className={inputCls} />
      </div>
    </div>
  );
}

// ── Add-variant panel ────────────────────────────────────────────

export function AddVariantPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<VariantFormState>(emptyVariantForm);
  const [error, setError] = useState<string | null>(null);

  const createVariant = useMutation({
    mutationFn: (payload: object) => api.post(`/admin/products/${product.id}/variants`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); onClose(); },
    onError: (err) => setError(getAxiosErrorMessage(err, "Failed to add variant")),
  });

  const submit = () => {
    if (!form.title || !form.sku || !form.price) { setError("Title, base SKU and price are required."); return; }
    createVariant.mutate(buildPayload(form));
  };

  return (
    <div className="border-t border-ink/5 bg-leaf/[0.03] p-4">
      <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-3">Add a size / variant</p>
      <VariantFields form={form} setForm={setForm} />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 mt-3">
        <button onClick={submit} disabled={createVariant.isPending}
          className="flex items-center gap-1.5 bg-leaf text-white rounded-lg px-4 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50">
          {createVariant.isPending && <RefreshCw size={12} className="animate-spin" />} Add variant
        </button>
        <button onClick={onClose} className="border border-ink/20 rounded-lg px-4 py-1.5 text-xs text-ink/60 hover:border-ink/40">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Edit-variant row (replaces the read-only row when active) ──────────────

export function EditVariantRow({ variant, onClose }: { variant: ProductVariant; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<VariantFormState>(() => toVariantForm(variant));
  const [error, setError] = useState<string | null>(null);

  const updateVariant = useMutation({
    mutationFn: (payload: object) => api.patch(`/admin/variants/${variant.id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); onClose(); },
    onError: (err) => setError(getAxiosErrorMessage(err, "Failed to update variant")),
  });

  return (
    <tr className="border-b border-ink/5 last:border-0 bg-amber-50/40">
      <td colSpan={6} className="px-5 py-4">
        <VariantFields form={form} setForm={setForm} />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button onClick={() => updateVariant.mutate(buildPayload(form))} disabled={updateVariant.isPending}
            className="flex items-center gap-1.5 bg-leaf text-white rounded-lg px-4 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50">
            {updateVariant.isPending && <RefreshCw size={12} className="animate-spin" />} Save changes
          </button>
          <button onClick={onClose} className="border border-ink/20 rounded-lg px-4 py-1.5 text-xs text-ink/60 hover:border-ink/40">
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

export function VariantTable({ product }: { product: Product }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingVariant, setAddingVariant] = useState(false);
  const qc = useQueryClient();

  const adjustStock = useMutation({
    mutationFn: ({ variantId, value }: { variantId: string; value: number }) =>
      api.patch(`/admin/variants/${variantId}/stock`, { operation: "set", value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const [stockEdit, setStockEdit] = useState<Record<string, string>>({});

  return (
    <div className="border-t border-ink/5 bg-ink/[0.02] overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-xs text-ink/40 border-b border-ink/5">
          <th className="text-left px-5 py-2 font-medium">Variant</th>
          <th className="text-left px-5 py-2 font-medium">SKU / #</th>
          <th className="text-right px-5 py-2 font-medium">Price</th>
          <th className="text-right px-5 py-2 font-medium">Stock</th>
          <th className="text-right px-5 py-2 font-medium w-36">Set stock</th>
          <th className="text-right px-5 py-2 font-medium w-10"></th>
        </tr></thead>
        <tbody>
          {product.variants.map((variant) =>
            editingId === variant.id ? (
              <EditVariantRow key={variant.id} variant={variant} onClose={() => setEditingId(null)} />
            ) : (
              <tr key={variant.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-2.5 text-ink/80">
                  {variant.title}{variant.isDefault && <span className="ml-1.5 text-xs text-leaf">(default)</span>}
                  {variant.packaging && <span className="ml-1.5 text-[10px] text-ink/30 uppercase">{variant.packaging}</span>}
                </td>
                <td className="px-5 py-2.5">
                  <p className="font-mono text-xs text-ink/50">{variant.sku}</p>
                  {variant.skuNumber && <p className="font-mono text-[10px] text-ink/25">#{variant.skuNumber}</p>}
                </td>
                <td className="px-5 py-2.5 text-right">₹{Number(variant.price)}</td>
                <td className="px-5 py-2.5 text-right">
                  <span className={variant.stock === 0 ? "text-red-500" : variant.stock <= (variant.lowStockAlert ?? 5) ? "text-amber-500" : "text-green-600"}>
                    {variant.stock}
                  </span>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <input type="number" min="0" value={stockEdit[variant.id] ?? ""}
                      onChange={(e) => setStockEdit((prev) => ({ ...prev, [variant.id]: e.target.value }))}
                      placeholder={String(variant.stock)} className="w-16 border border-ink/15 rounded-lg px-2 py-1 text-xs text-right" />
                    <button onClick={() => {
                      const val = parseInt(stockEdit[variant.id] ?? "", 10);
                      if (!isNaN(val)) {
                        adjustStock.mutate({ variantId: variant.id, value: val });
                        setStockEdit((prev) => { const next = { ...prev }; delete next[variant.id]; return next; });
                      }
                    }} className="text-leaf hover:text-leaf/70 text-xs font-medium">Save</button>
                  </div>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <button onClick={() => setEditingId(variant.id)} className="text-ink/30 hover:text-leaf transition-colors p-1">
                    <Pencil size={14} />
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {addingVariant ? (
        <AddVariantPanel product={product} onClose={() => setAddingVariant(false)} />
      ) : (
        <div className="border-t border-ink/5 p-3">
          <button onClick={() => setAddingVariant(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-leaf hover:opacity-70 px-2 py-1">
            <Plus size={13} /> Add a size / variant
          </button>
        </div>
      )}
    </div>
  );
}
