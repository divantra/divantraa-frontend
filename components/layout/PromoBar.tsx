"use client";

import { usePromoConfig } from "@/hooks/usePromoConfig";

export function PromoBar() {
  const { data: promo, isLoading } = usePromoConfig();

  // If query is finished and promo code is explicitly null, collapse bar
  if (!isLoading && !promo?.promoCode) {
    return null;
  }

  return (
    <aside
      aria-label="Promotional Announcement"
      className="bg-forest text-cream text-center text-xs sm:text-sm h-[36px] sm:h-[38px] px-4 flex items-center justify-center overflow-hidden"
    >
      {promo?.promoCode ? (
        <p className="truncate">
          Pure Desi Ghee &amp; Oils At {promo.promoDiscountPercent}% OFF | Use Code:{" "}
          <span className="font-semibold text-white tracking-wide">{promo.promoCode}</span>
        </p>
      ) : (
        <span className="opacity-0 pointer-events-none select-none">
          Pure Desi Ghee &amp; Oils At 15% OFF | Use Code: DIWAN15
        </span>
      )}
    </aside>
  );
}
