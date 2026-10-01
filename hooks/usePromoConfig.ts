"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PromoConfig {
  promoCode: string | null;
  promoDiscountPercent: number;
  coinEarnRate: number;
}

/**
 * The standing promo code and coin-earn rate, from the server — nothing hard-coded.
 * Shared by every "Best Price with CODE" / "earn N coins" display in the app.
 */
export function usePromoConfig() {
  return useQuery<PromoConfig>({
    queryKey: ["promo-config"],
    queryFn: async () => (await api.get<{ data: PromoConfig }>("/pricing/promo-config")).data.data,
    staleTime: 5 * 60_000,
  });
}

/** Best-price preview for a given rupee amount, or null while the config hasn't loaded / no code is active. */
export function bestPrice(amount: number, config: PromoConfig | undefined): number | null {
  if (!config?.promoCode || !config.promoDiscountPercent) return null;
  return Math.round(amount * (1 - config.promoDiscountPercent / 100));
}

/** Coins earned preview for a given rupee amount (4 coins per Rs.100 by default, server-configured). */
export function coinsEarned(amount: number, config: PromoConfig | undefined): number {
  if (!config?.coinEarnRate) return 0;
  return Math.floor((amount / 100) * config.coinEarnRate);
}
