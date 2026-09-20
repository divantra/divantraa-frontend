"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";
import type { Product } from "@/types/product";
import { getDefaultVariant, getDiscountPercent } from "@/types/product";

/**
 * Shown right after an item is added to the cart. Lists products flagged
 * `isRecommended` in the database (excluding the one just added) so the
 * customer can add them in one tap.
 */
export function AddOnsDrawer() {
  const sourceProductId = useUiStore((s) => s.addOnsForProductId);
  const closeAddOns = useUiStore((s) => s.closeAddOns);
  const { addItem, openCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const isOpen = sourceProductId !== null;

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ["recommended-products"],
    queryFn: async () =>
      (await api.get<{ data: Product[] }>("/products", { params: { recommended: "true", limit: 12 } })).data.data,
    staleTime: 60_000,
  });

  const addOns = (data ?? []).filter((p) => p.id !== sourceProductId && getDefaultVariant(p));

  // Pre-select the first two suggestions each time the drawer opens.
  useEffect(() => {
    if (isOpen) setSelected(new Set(addOns.slice(0, 2).map((p) => p.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, data]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAddOns();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeAddOns]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    for (const p of addOns) {
      if (!selected.has(p.id)) continue;
      const v = getDefaultVariant(p);
      if (!v) continue;
      addItem({
        productId: p.id,
        variantId: v.id,
        title: p.title,
        variantTitle: v.title,
        slug: p.slug,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        image: v.resolvedImages?.[0] ?? v.images?.[0] ?? p.images?.[0] ?? "",
      });
      if (user) api.post("/cart/items", { variantId: v.id, quantity: 1 }).catch(() => {});
    }
    closeAddOns();
    if (selected.size > 0) openCart();
  }

  return (
    <AnimatePresence>
      {isOpen && addOns.length > 0 && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddOns}
          />
          <motion.aside
            role="dialog"
            aria-label="Recommended add-ons"
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[380px] flex-col bg-white shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <p className="flex items-center gap-2 text-sm font-medium text-forest">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-white">
                  <Check size={12} strokeWidth={3} />
                </span>
                Added to Cart!
              </p>
              <button
                onClick={closeAddOns}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 text-ink/60 hover:bg-ink/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <h2 className="font-display text-xl text-ink">Top Add-Ons for This Product</h2>
              <p className="mt-1 mb-4 text-xs text-ink/50">
                These are usually added together — don&apos;t miss out
              </p>

              <ul className="space-y-3">
                {addOns.map((p) => {
                  const v = getDefaultVariant(p)!;
                  const img = v.resolvedImages?.[0] ?? v.images?.[0] ?? p.images?.[0] ?? "";
                  const off = getDiscountPercent(v);
                  const checked = selected.has(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggle(p.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                          checked ? "border-forest/40 bg-leaf/5" : "border-ink/10 bg-ink/[0.03] hover:border-ink/20"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            checked ? "border-forest bg-forest text-white" : "border-ink/30 bg-white"
                          }`}
                        >
                          {checked && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-ink/10 bg-white">
                          {img && <Image src={img} alt={p.title} fill sizes="56px" className="object-contain p-1" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-snug text-ink">{p.title}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold text-forest">
                              ₹{Number(v.price).toLocaleString("en-IN")}
                            </span>
                            {off > 0 && (
                              <>
                                <span className="text-xs text-ink/40 line-through">
                                  ₹{Number(v.compareAtPrice).toLocaleString("en-IN")}
                                </span>
                                <span className="rounded bg-forest px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {off}% OFF
                                </span>
                              </>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-ink/10 px-5 py-4">
              <button
                onClick={closeAddOns}
                className="rounded-xl border-2 border-forest py-3 text-sm font-semibold text-forest hover:bg-forest/5"
              >
                Skip
              </button>
              <button
                onClick={handleAdd}
                disabled={selected.size === 0}
                className="rounded-xl bg-forest py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Add to Cart
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
