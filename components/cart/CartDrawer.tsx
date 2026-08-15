"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

const FREE_SHIPPING_THRESHOLD = 999;

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, subtotal } = useCartStore();
  const total = subtotal();
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
  const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-ink/40 z-50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-cream z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-ink/5">
              <h2 className="font-display text-lg">Your bag</h2>
              <button onClick={closeCart} aria-label="Close cart">
                <X size={20} />
              </button>
            </div>

            {/* Free shipping progress */}
            <div className="px-6 py-4 border-b border-ink/5">
              {remaining > 0 ? (
                <p className="text-xs text-ink/60 mb-2">
                  Add <span className="font-semibold text-forest">₹{remaining}</span> more for free shipping
                </p>
              ) : (
                <p className="text-xs text-forest font-medium mb-2">
                  🎉 You&apos;ve unlocked free shipping!
                </p>
              )}
              <div className="h-1.5 w-full rounded-full bg-ink/10 overflow-hidden">
                <motion.div
                  className="h-full bg-leaf"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 && (
                <p className="text-sm text-ink/40 text-center mt-10">Your bag is empty.</p>
              )}
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="h-20 w-20 rounded-xl bg-ink/5 overflow-hidden relative shrink-0">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.title}</p>
                    <p className="text-sm text-ink/50 mb-2">₹{item.price}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-ink/10 rounded-full">
                        <button
                          className="p-1.5"
                          onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs w-5 text-center">{item.quantity}</span>
                        <button
                          className="p-1.5"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-ink/30 hover:text-red-500"
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-ink/5 px-6 py-5">
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-ink/60">Subtotal</span>
                  <span className="font-semibold">₹{total.toFixed(0)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-xl bg-leaf py-3.5 text-center text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
