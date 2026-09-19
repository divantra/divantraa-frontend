"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image.utils";
import { Product, getDefaultVariant } from "@/types/product";

// ── Constants (must match backend env defaults) ───────────────────
const SHIPPING_FREE_THRESHOLD = 999;
const SHIPPING_FEE            = 79;
const COD_FEE                 = 50;

// ── Helpers ────────────────────────────────────────────────────────

function calcShipping(subtotal: number) {
  return subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE;
}

function discountPct(price: number, mrp: number | null | undefined) {
  if (!mrp || mrp <= price) return null;
  return Math.round(((mrp - price) / mrp) * 100);
}

// ── Sync cart item to server ───────────────────────────────────────

async function syncItemToServer(variantId: string, quantity: number, user: unknown) {
  if (!user) return;
  try {
    if (quantity <= 0) {
      // Find item id from server cart first — this is fire-and-forget
      const { data } = await api.get("/cart");
      const si = data.data?.items?.find((i: { variantId: string; id: string }) => i.variantId === variantId);
      if (si) await api.delete(`/cart/items/${si.id}`);
    } else {
      // Use PATCH with the item id (need to find it first), or just call add which upserts
      const { data } = await api.get("/cart");
      const si = data.data?.items?.find((i: { variantId: string; id: string }) => i.variantId === variantId);
      if (si) {
        await api.patch(`/cart/items/${si.id}`, { quantity });
      }
    }
  } catch { /* non-fatal */ }
}

// ── Page component ─────────────────────────────────────────────────

export default function CartPage() {
  const router        = useRouter();
  const user          = useAuthStore((s) => s.user);
  const openLoginModal = useUiStore((s) => s.openLoginModal);
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const [syncing, setSyncing] = useState<string | null>(null);

  const sub      = subtotal();
  const shipping = calcShipping(sub);
  const total    = sub + shipping + COD_FEE;
  const savings  = items.reduce((s, i) => {
    const mrp = i.compareAtPrice;
    if (mrp && mrp > i.price) s += (mrp - i.price) * i.quantity;
    return s;
  }, 0);

  // Related products — fetch featured/active products
  const { data: relatedData } = useQuery<{ data: Product[] }>({
    queryKey: ["cart-related"],
    queryFn:  () => api.get("/products?limit=6&sort=featured").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const related = (relatedData?.data ?? []).filter(
    (p) => !items.some((i) => i.productId === p.id)
  ).slice(0, 4);

  async function handleQuantityChange(variantId: string, newQty: number) {
    setSyncing(variantId);
    updateQuantity(variantId, newQty);
    await syncItemToServer(variantId, newQty, user);
    setSyncing(null);
  }

  async function handleRemove(variantId: string) {
    setSyncing(variantId);
    removeItem(variantId);
    await syncItemToServer(variantId, 0, user);
    setSyncing(null);
  }

  async function handleClearCart() {
    clearCart();
    if (user) {
      try { await api.delete("/cart"); } catch { /* non-fatal */ }
    }
  }

  // ── Empty state ──────────────────────────────────────────────────

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-6">
          <ShoppingBag size={72} className="text-ink/10" />
        </div>
        <h1 className="font-display text-3xl text-ink mb-3">Your cart is empty</h1>
        <p className="text-ink/50 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-leaf text-white px-8 py-3.5 font-medium hover:opacity-90 transition-opacity"
        >
          Shop Now <ArrowRight size={16} />
        </Link>
      </main>
    );
  }

  // ── Cart with items ──────────────────────────────────────────────

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-3xl text-ink mb-6">Shopping Cart</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">

        {/* ── Item list ──────────────────────────────────────────── */}
        <div>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink/5">
              <span className="text-sm font-medium text-ink">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleClearCart}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                Clear cart
              </button>
            </div>

            {items.map((item, idx) => {
              const mrp  = item.compareAtPrice;
              const disc = discountPct(item.price, mrp);
              const isSyncing = syncing === item.variantId;

              return (
                <div
                  key={item.variantId}
                  className={`flex gap-4 px-6 py-5 ${
                    idx < items.length - 1 ? "border-b border-ink/5" : ""
                  } ${isSyncing ? "opacity-60" : ""}`}
                >
                  {/* Image */}
                  <Link href={`/products/${item.slug}`} className="shrink-0">
                    <div className="h-24 w-24 rounded-xl bg-ink/5 overflow-hidden relative">
                      {item.image && (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`}>
                          <p className="font-medium text-ink text-sm leading-snug hover:text-leaf truncate">
                            {item.title}
                          </p>
                        </Link>
                        {item.variantTitle && (
                          <p className="text-xs text-ink/50 mt-0.5">{item.variantTitle}</p>
                        )}
                      </div>
                      {disc && (
                        <span className="shrink-0 text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full h-fit">
                          {disc}% off
                        </span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="font-semibold text-ink">₹{item.price}</span>
                      {mrp && mrp > item.price && (
                        <span className="text-xs text-ink/40 line-through">₹{mrp}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-ink/15 rounded-full w-fit">
                        <button
                          onClick={() => handleQuantityChange(item.variantId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isSyncing}
                          className="p-2 disabled:opacity-30"
                          aria-label="Decrease"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.variantId, item.quantity + 1)}
                          disabled={isSyncing}
                          className="p-2"
                          aria-label="Increase"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-ink">
                          ₹{(item.price * item.quantity).toFixed(0)}
                        </span>
                        <button
                          onClick={() => handleRemove(item.variantId)}
                          disabled={isSyncing}
                          className="text-ink/25 hover:text-red-500 transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl text-ink mb-4">You might also like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {related.map((p) => {
                  const v = getDefaultVariant(p);
                  const img = v?.images?.[0] || p.images?.[0];
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="group bg-white rounded-xl border border-ink/8 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative h-36 bg-ink/5">
                        {img && (
                          <Image
                            src={getImageUrl(img)}
                            alt={p.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-medium text-ink line-clamp-2 leading-snug">{p.title}</p>
                        {v && (
                          <p className="text-xs text-leaf font-semibold mt-1">₹{Number(v.price).toFixed(0)}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Order summary sidebar ─────────────────────────────── */}
        <aside className="h-fit">
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 sticky top-24">
            <h2 className="font-semibold text-ink mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink/70">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{sub.toFixed(0)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1"><Tag size={12} /> Savings</span>
                  <span>-₹{savings.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink/70">
                <span>Shipping</span>
                <span>
                  {shipping === 0
                    ? <span className="text-green-600 font-medium">Free</span>
                    : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>COD Charge</span>
                <span>₹{COD_FEE}</span>
              </div>
              {sub < SHIPPING_FREE_THRESHOLD && (
                <p className="text-xs text-ink/40 bg-cream rounded-lg px-3 py-2">
                  Add ₹{(SHIPPING_FREE_THRESHOLD - sub).toFixed(0)} more to get FREE shipping
                </p>
              )}
              <div className="border-t border-ink/8 pt-3 flex justify-between font-semibold text-ink text-base">
                <span>Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (!user) { openLoginModal(); return; }
                router.push("/checkout");
              }}
              className="mt-5 w-full rounded-xl bg-leaf text-white font-medium py-3.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            {!user && (
              <p className="mt-3 text-center text-xs text-ink/40">
                Please log in to place your order
              </p>
            )}

            <Link
              href="/products"
              className="mt-3 block text-center text-sm text-leaf hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
