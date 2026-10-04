"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PromoConfig {
  promoCode: string | null;
  promoDiscountPercent: number;
  coinEarnRate: number;
}

const CACHE_KEY = "divantraa_promo_config";

/** Default fallback values so SSR and initial client load never suffer from layout shifts */
export const DEFAULT_PROMO_CONFIG: PromoConfig = {
  promoCode: "DIWAN15",
  promoDiscountPercent: 15,
  coinEarnRate: 4,
};

function getInitialPromoConfig(): PromoConfig {
  if (typeof window === "undefined") return DEFAULT_PROMO_CONFIG;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed.promoDiscountPercent === "number") {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_PROMO_CONFIG;
}

/**
 * The standing promo code and coin-earn rate, with instant hydration
 * to prevent layout shifts (CLS) on page refresh.
 */
export function usePromoConfig() {
  return useQuery<PromoConfig>({
    queryKey: ["promo-config"],
    queryFn: async () => {
      const data = (await api.get<{ data: PromoConfig }>("/pricing/promo-config")).data.data;
      if (typeof window !== "undefined" && data) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {}
      }
      return data;
    },
    staleTime: 5 * 60_000,
    placeholderData: getInitialPromoConfig,
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
