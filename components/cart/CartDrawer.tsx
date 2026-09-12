"use client";

import Link from "next/link";
import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, subtotal } = useCartStore();
  const total = subtotal();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl rounded-l-2xl"
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
                  <Image src="/images/empty_cart.jpeg" alt="Empty cart" width={250} height={250} />
                  <h3 className="font-display text-lg text-ink mt-6">Nothing in your cart yet.</h3>
                  <p className="text-sm text-ink/60 mt-1 max-w-xs mx-auto">
                    Let&apos;s fix that with something pure and delicious.
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-leaf text-white px-6 py-3 text-sm font-medium hover:opacity-90"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </>
            ) : (
              /* ── Cart items ── */
              <>
                <div className="relative flex items-center justify-center px-6 h-16 border-b border-ink/5">
                  <button onClick={closeCart} className="absolute left-4" aria-label="Go back">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="font-display text-lg">Your Cart</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <ShoppingBag size={24} className="text-leaf" />
                      <h3 className="font-display text-xl text-leaf">Cart details</h3>
                    </div>
                    <p className="text-sm font-medium text-ink/80">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {items.map((item) => (
                      /* Key on variantId — same product in different sizes = separate lines */
                      <div key={item.variantId} className="flex gap-4 border-b border-ink/5 pb-4">
                        <div className="h-20 w-20 rounded-xl bg-ink/5 overflow-hidden relative shrink-0">
                          {item.image && (
                            <Image src={item.image} alt={item.title} fill className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{item.title}</p>
                          {/* Variant label (e.g. "500 ml Glass Jar") */}
                          {item.variantTitle && (
                            <p className="text-xs text-ink/50 mb-0.5">{item.variantTitle}</p>
                          )}
                          <p className="text-sm text-ink/60">₹{item.price}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-ink/10 rounded-full w-fit">
                              <button
                                className="p-1.5"
                                onClick={() =>
                                  updateQuantity(item.variantId, Math.max(1, item.quantity - 1))
                                }
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs w-5 text-center">{item.quantity}</span>
                              <button
                                className="p-1.5"
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="text-ink/30 hover:text-red-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center py-6">
                    <Link
                      href="/products"
                      onClick={closeCart}
                      className="text-sm font-medium text-forest hover:underline"
                    >
                      Add more items
                    </Link>
                  </div>
                </div>

                <div className="border-t border-ink/5 px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-ink/60">Subtotal</p>
                    <p className="font-display text-lg">₹{total.toFixed(0)}</p>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="rounded-xl bg-leaf px-8 py-3.5 text-center text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Continue
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
