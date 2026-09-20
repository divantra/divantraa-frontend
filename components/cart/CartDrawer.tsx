"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash, ChevronLeft, ChevronRight, ChevronDown, ShoppingCart, Lock, Truck } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image.utils";
import { useQuote, rupees } from "@/hooks/useQuote";
import type { Product } from "@/types/product";
import { getDefaultVariant } from "@/types/product";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, addItem } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Live server prices, stock and fees — the drawer never trusts stored prices.
  const { data: quote } = useQuote(items);
  const lineByVariant = new Map((quote?.lines ?? []).map((l) => [l.variantId, l]));
  const online = quote?.methods.online;
  const base = online ? online.subtotal + online.shippingFee : null;
  const pct = quote?.onlineDiscountPercent ?? 0;
  const threshold = quote?.freeShippingThreshold ?? 0;
  const subtotalNow = online?.subtotal ?? 0;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const hasIssue = (quote?.lines ?? []).some((l) => !l.available);

  const { data: recommended } = useQuery({
    queryKey: ["recommended-products"],
    queryFn: async () => (await api.get<{ data: Product[] }>("/products", { params: { recommended: "true", limit: 12 } })).data.data,
    staleTime: 60_000,
    enabled: isOpen,
  });
  const inCart = new Set(items.map((i) => i.productId));
  const suggestions = (recommended ?? []).filter((p) => !inCart.has(p.id) && getDefaultVariant(p));

  // Sync a single item to the server cart (best-effort, non-blocking).
  async function syncQty(variantId: string, newQty: number) {
    if (!user) return;
    try {
      const { data } = await api.get("/cart");
      const si = (data.data?.items ?? []).find((i: { variantId: string; id: string }) => i.variantId === variantId);
      if (!si) return;
      if (newQty <= 0) await api.delete(`/cart/items/${si.id}`);
      else             await api.patch(`/cart/items/${si.id}`, { quantity: newQty });
    } catch { /* non-fatal */ }
  }

  function handleUpdateQty(variantId: string, newQty: number) {
    updateQuantity(variantId, newQty);
    syncQty(variantId, newQty);
  }

  function handleRemove(variantId: string) {
    removeItem(variantId);
    syncQty(variantId, 0);
  }

  function addSuggestion(p: Product) {
    const v = getDefaultVariant(p);
    if (!v) return;
    addItem({
      productId: p.id, variantId: v.id, title: p.title, variantTitle: v.title, slug: p.slug,
      price: Number(v.price), compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      image: v.resolvedImages?.[0] ?? v.images?.[0] ?? p.images?.[0] ?? "",
    });
    if (user) api.post("/cart/items", { variantId: v.id, quantity: 1 }).catch(() => {});
  }

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink/40 z-50"
          />

          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-label="Your cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl sm:rounded-l-2xl overflow-hidden"
          >
            {items.length === 0 ? (
              /* ── Empty state ── */
              <>
                <div className="flex items-center justify-end px-6 h-16">
                  <button
                    onClick={closeCart}
                    className="h-8 w-8 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center transition-colors"
                    aria-label="Close cart"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-col items-center text-center pt-10 px-6">
                  <Image src={getImageUrl('public/empty_cart.jpeg')} alt="Empty cart" width={250} height={250} />
                  <h3 className="font-display text-lg text-ink mt-6">Nothing in your cart yet.</h3>
                  <p className="text-sm text-ink/60 mt-1 max-w-xs mx-auto">
                    Let&apos;s fix that with something pure and delicious.
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest text-white px-6 py-3 text-sm font-medium hover:opacity-90"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Header */}
                <div className="relative flex items-center justify-center px-5 h-14 bg-cream/40">
                  <button onClick={closeCart} className="absolute left-4 text-forest" aria-label="Go back">
                    <ChevronLeft size={22} />
                  </button>
                  <h2 className="font-display text-lg font-semibold text-forest">Your Cart</h2>
                </div>

                {/* Trust banner */}
                <div className="flex items-center justify-center gap-2 whitespace-nowrap rounded-b-3xl bg-forest px-4 py-2.5 text-xs font-semibold text-white shadow-sm sm:text-sm">
                  <Lock size={14} className="shrink-0 text-gold" />
                  Secure Payment <span aria-hidden>•</span> Free 7-day returns
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-forest">
                      <ShoppingCart size={24} />
                      <h3 className="font-display text-xl font-semibold">Cart details</h3>
                    </div>
                    <p className="text-sm text-ink/70">Total items: <span className="font-semibold text-ink">{totalItems}</span></p>
                  </div>

                  <ul className="space-y-3">
                    {items.map((item) => {
                      const live = lineByVariant.get(item.variantId);
                      const price = live?.available !== undefined && live.unitPrice ? live.unitPrice : item.price;
                      const compare = item.compareAtPrice && item.compareAtPrice > price ? item.compareAtPrice : null;
                      const off = compare ? Math.round(((compare - price) / compare) * 100) : 0;
                      const maxQty = live?.trackInventory && live.stock ? live.stock : 99;
                      return (
                        /* Key on variantId — same product in different sizes = separate lines */
                        <li key={item.variantId} className="flex gap-3 rounded-2xl border border-ink/10 bg-white p-3 shadow-sm">
                          <Link href={`/products/${item.slug}`} onClick={closeCart} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                            {item.image && <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />}
                          </Link>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{item.title}</p>
                            {item.variantTitle && (
                              <span className="mt-1 inline-block rounded bg-leaf/10 px-2 py-0.5 text-[10px] font-medium text-leaf">
                                {item.variantTitle}
                              </span>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                              <span className="text-sm font-bold text-ink">{rupees(price)}</span>
                              {compare && (
                                <>
                                  <span className="text-xs text-ink/40 line-through">{rupees(compare)}</span>
                                  <span className="text-xs text-ink/60">({off}% off)</span>
                                </>
                              )}
                            </div>
                            {live && !live.available && <p className="mt-1 text-xs font-medium text-red-500">{live.issue}</p>}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex w-fit items-center rounded-full border border-ink/15">
                                <button
                                  className="p-2 text-ink/60 hover:text-ink"
                                  onClick={() => handleUpdateQty(item.variantId, Math.max(1, item.quantity - 1))}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
                                <button
                                  className="p-2 text-ink/60 hover:text-ink disabled:opacity-30"
                                  disabled={item.quantity >= maxQty}
                                  onClick={() => handleUpdateQty(item.variantId, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                onClick={() => handleRemove(item.variantId)}
                                className="p-1 text-ink/30 transition-colors hover:text-red-500"
                                aria-label={`Remove ${item.title}`}
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="mt-4 flex items-center justify-center gap-2 rounded-full border-2 border-forest py-3 text-sm font-semibold text-forest transition-colors hover:bg-forest/5"
                  >
                    Add more items <ChevronRight size={16} />
                  </Link>

                  {/* Dynamic offer banner */}
                  {quote && (
                    <div className="mt-4 rounded-xl bg-gold/15 px-4 py-3 text-center text-sm font-medium text-clay">
                      {threshold > 0 && subtotalNow < threshold ? (
                        <span className="inline-flex items-center gap-2">
                          <Truck size={15} /> Add {rupees(threshold - subtotalNow)} more for FREE delivery
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2"><Truck size={15} /> You&apos;ve unlocked FREE delivery</span>
                      )}
                      {pct > 0 && <span className="mt-0.5 block text-xs">Pay online and get an extra {pct}% off</span>}
                    </div>
                  )}

                  {/* You might also like */}
                  {suggestions.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 font-display text-lg font-semibold text-forest">You might also like</h3>
                      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
                        {suggestions.map((p) => {
                          const v = getDefaultVariant(p)!;
                          const img = v.resolvedImages?.[0] ?? v.images?.[0] ?? p.images?.[0] ?? "";
                          return (
                            <div key={p.id} className="w-[210px] shrink-0 snap-start rounded-2xl border border-ink/10 bg-white p-3">
                              <div className="flex gap-3">
                                <Link href={`/products/${p.slug}`} onClick={closeCart} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                                  {img && <Image src={img} alt={p.title} fill sizes="64px" className="object-cover" />}
                                </Link>
                                <div className="min-w-0">
                                  <p className="line-clamp-2 text-xs font-medium text-ink">{p.title}</p>
                                  <p className="mt-1 text-sm font-bold text-ink">{rupees(Number(v.price))}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => addSuggestion(p)}
                                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-forest py-1.5 text-xs font-semibold text-forest hover:bg-forest/5"
                              >
                                <Plus size={13} /> Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky total + checkout */}
                <div className="border-t border-ink/10 bg-white px-4 pb-4 pt-3 shadow-[0_-6px_16px_rgba(0,0,0,0.05)]">
                  {showBreakdown && online && (
                    <dl className="mb-3 space-y-1.5 rounded-xl bg-ink/[0.03] p-3 text-sm">
                      <div className="flex justify-between text-ink/70"><dt>Subtotal</dt><dd>{rupees(online.subtotal)}</dd></div>
                      <div className="flex justify-between text-ink/70">
                        <dt>Shipping</dt>
                        <dd>{online.shippingFee === 0 ? <span className="text-green-600">Free</span> : rupees(online.shippingFee)}</dd>
                      </div>
                      {online.discount > 0 && (
                        <div className="flex justify-between text-green-700"><dt>Online payment discount</dt><dd>−{rupees(online.discount)}</dd></div>
                      )}
                      {quote?.methods.cod.enabled && quote.methods.cod.codFee > 0 && (
                        <p className="pt-1 text-xs text-ink/40">Cash on delivery adds {rupees(quote.methods.cod.codFee)}.</p>
                      )}
                    </dl>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        onClick={() => setShowBreakdown((v) => !v)}
                        aria-expanded={showBreakdown}
                        className="flex items-center gap-1 font-display text-2xl font-semibold text-ink"
                      >
                        {base != null ? rupees(base) : "—"}
                        <ChevronDown size={20} className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
                      </button>
                      {pct > 0 && online?.enabled ? (
                        <p className="mt-0.5 inline-block rounded-md bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700">
                          Or {rupees(online.total)} with online payment
                        </p>
                      ) : (
                        <p className="text-[11px] text-ink/40">Incl. shipping · taxes included</p>
                      )}
                    </div>
                    <Link
                      href="/checkout"
                      onClick={(e) => { if (hasIssue) e.preventDefault(); else closeCart(); }}
                      aria-disabled={hasIssue}
                      className={`shrink-0 rounded-full bg-forest px-9 py-3.5 text-center text-base font-semibold text-white transition-opacity ${hasIssue ? "opacity-40" : "hover:opacity-90"}`}
                    >
                      Checkout
                    </Link>
                  </div>
                  {hasIssue && <p className="mt-2 text-center text-xs text-red-500">Remove unavailable items to continue.</p>}
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
