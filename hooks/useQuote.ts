"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MethodTotals {
  enabled: boolean;
  subtotal: number;
  shippingFee: number;
  codFee: number;
  discount: number;
  total: number;
}

export interface Quote {
  allAvailable: boolean;
  freeShippingThreshold: number;
  onlineDiscountPercent: number;
  lines: { variantId: string; quantity: number; unitPrice: number; stock: number; trackInventory: boolean; available: boolean; issue?: string }[];
  methods: { online: MethodTotals; cod: MethodTotals };
}

/**
 * Server-side price quote for the given cart lines. Fees, discounts and the
 * free-shipping rule all come from the backend — nothing is hard-coded in the UI.
 */
export function useQuote(items: { variantId: string; quantity: number }[]) {
  const key = items.map((i) => `${i.variantId}:${i.quantity}`).sort().join(",");
  return useQuery<Quote>({
    queryKey: ["quote", key],
    enabled: items.length > 0,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    queryFn: async () =>
      (await api.post("/pricing/quote", { items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) })).data.data,
  });
}

export const rupees = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
