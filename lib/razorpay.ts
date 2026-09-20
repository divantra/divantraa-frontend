/**
 * Razorpay Standard Checkout helpers.
 *
 * Card / UPI / netbanking / wallet details are entered inside Razorpay's own
 * hosted window — they never touch our pages or servers (PCI scope stays with
 * Razorpay). We only choose WHICH method to show and receive the result.
 */

export type OnlineMethod = "upi" | "card" | "netbanking" | "wallet";

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailure {
  error: { code?: string; description?: string; reason?: string };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string; method?: string; bank?: string; vpa?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  method?: Partial<Record<"upi" | "card" | "netbanking" | "wallet" | "emi" | "paylater", boolean>>;
  retry?: { enabled: boolean; max_count?: number };
  timeout?: number;
  modal?: { ondismiss?: () => void; confirm_close?: boolean; escape?: boolean; backdropclose?: boolean };
  handler: (res: RazorpaySuccess) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (res: RazorpayFailure) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayCtor = new (opts: RazorpayOptions) => RazorpayInstance;
// checkout.js and razorpay.js (custom) both assign window.Razorpay — keep our own reference.
let hostedCtor: RazorpayCtor | null = null;

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<boolean> | null = null;

/** Loads checkout.js once. Resolves false if it is blocked/offline. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (hostedCtor) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => { hostedCtor = window.Razorpay ?? null; resolve(!!hostedCtor); };
    s.onerror = () => {
      scriptPromise = null; // allow a retry
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Restrict the hosted window to the one method the customer picked on our page. */
function onlyMethod(m: OnlineMethod): RazorpayOptions["method"] {
  return { upi: m === "upi", card: m === "card", netbanking: m === "netbanking", wallet: m === "wallet", emi: false, paylater: false };
}

export interface CheckoutArgs {
  keyId: string;
  razorpayOrderId: string;
  amount: number; // paise, as returned by the server
  currency: string;
  method: OnlineMethod;
  bank?: string;  // netbanking: Razorpay bank code, e.g. "HDFC"
  prefill: { name?: string; contact?: string; email?: string };
  orderNumber?: string | null;
  onSuccess: (res: RazorpaySuccess) => void;
  onFailure: (message: string) => void;
  onDismiss: () => void;
}

/** Opens the Razorpay window. Throws if checkout.js could not be loaded. */
export async function openRazorpayCheckout(a: CheckoutArgs): Promise<void> {
  const ok = await loadRazorpay();
  if (!ok || !hostedCtor) throw new Error("Could not load the secure payment window. Check your connection and try again.");

  const rzp = new hostedCtor({
    key: a.keyId,
    amount: a.amount,
    currency: a.currency,
    order_id: a.razorpayOrderId,
    name: "Divantraa",
    description: a.orderNumber ? `Order ${a.orderNumber}` : "Divantraa order",
    prefill: {
      ...a.prefill,
      method: a.method,
      ...(a.method === "netbanking" && a.bank ? { bank: a.bank } : {}),
    },
    notes: a.orderNumber ? { order: a.orderNumber } : undefined,
    theme: { color: "#00584B" },
    method: onlyMethod(a.method),
    retry: { enabled: true, max_count: 4 },
    timeout: 15 * 60, // seconds; the server expires unpaid orders after 30 min
    modal: { confirm_close: true, escape: false, backdropclose: false, ondismiss: a.onDismiss },
    handler: a.onSuccess,
  });
  rzp.on("payment.failed", (r) => a.onFailure(r.error?.description ?? "The payment could not be completed."));
  rzp.open();
}
