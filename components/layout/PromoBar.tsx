"use client";

import { usePromoConfig } from "@/hooks/usePromoConfig";

export function PromoBar() {
  const { data: promo } = usePromoConfig();
  if (!promo?.promoCode) return null;

  return (
    <div className="bg-forest text-cream text-center text-xs sm:text-sm py-2.5 px-4">
      Pure Desi Ghee &amp; Oils At {promo.promoDiscountPercent}% OFF | Use Code:{" "}
      <span className="font-semibold">{promo.promoCode}</span>
    </div>
  );
}
