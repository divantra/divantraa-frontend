"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PromoConfig {
  promoCode: string | null;
  promoDiscountPercent: number;
  coinEarnRate: number;
}

const CACHE_KEY = "divantraa_promo_config";

/** Default fallback values so the server render and the client's FIRST paint always match —
 *  reading localStorage during render (instead of after mount) caused a hydration mismatch
 *  whenever the cached value differed from this default (e.g. right after the promo code
 *  changes, before a visitor's cache catches up). */
export const DEFAULT_PROMO_CONFIG: PromoConfig = {
  promoCode: "DIVANT15",
  promoDiscountPercent: 15,
  coinEarnRate: 4,
};

function readCachedPromoConfig(): PromoConfig | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    return parsed && typeof parsed.promoDiscountPercent === "number" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The standing promo code and coin-earn rate, with instant hydration to prevent layout shifts
 * (CLS) on page refresh.
 *
 * The cached value is read in an effect (after mount, never during the render React must match
 * against the server's HTML) and used only as `placeholderData` — never written into the query
 * cache directly (e.g. via setQueryData), which would mark it "fresh" and block the real fetch
 * from correcting a stale value for up to staleTime. placeholderData has no such effect: the real
 * queryFn still runs on mount regardless and overwrites it as soon as it resolves.
 */
export function usePromoConfig() {
  const [cached, setCached] = useState<PromoConfig | null>(null);

  useEffect(() => {
    setCached(readCachedPromoConfig());
  }, []);

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
    placeholderData: cached ?? DEFAULT_PROMO_CONFIG,
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
