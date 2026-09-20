"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import { ArrowRight , ShoppingCart } from "lucide-react";

export function CartFooterBar() {
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount());
  const total = useCartStore((s) => s.totalPrice());
  const openCart = useCartStore((s) => s.openCart);
  const isCartOpen = useCartStore((s) => s.isOpen);
  const pathname = usePathname();

  // The cart lives in localStorage, which the server can't see. Render nothing until the
  // page has mounted so the server HTML and first client render match (no hydration warning).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hide while the cart drawer is open so it never covers the Checkout button.
  const onCheckoutFlow = /^\/(checkout|cart|order-confirmation)/.test(pathname ?? "");
  if (!mounted || itemCount === 0 || isCartOpen || onCheckoutFlow) return null;

  const visibleItems = items.slice(0, 2);
  const remainingCount = itemCount - visibleItems.length;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-forest text-white rounded-full px-3 py-2 flex items-center gap-6 shadow-lg w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        
        {/* Thumbnails with overlap */}
        <div className="flex -space-x-3">
          {visibleItems.map((item) => (
            <div
              key={item.productId}
              className="h-8 w-8 rounded-full overflow-hidden border-0">
              <Image
                src={item.image}
                alt={item.title}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gold text-xs font-semibold text-ink border-2 border-white">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* Item count + total */}
        <div>
          <p className="text-xs font-semibold text-white/70">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
          <p className="text-sm font-semibold text-white">{new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(total)}
          </p>
        </div>

        {/* View cart button */}
        <Link
          href="/cart"
          className="flex items-center gap-1 bg-gold text-sm font-semibold px-3 py-2 rounded-full text-ink hover:opacity-90 transition-opacity"
        >
          <ShoppingCart size={16} />
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
