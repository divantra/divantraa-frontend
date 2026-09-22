/**
 * Cashfree JS SDK v3 helpers.
 * Docs: https://www.cashfree.com/docs/payments/online/element/overview
 *
 * Card / UPI / netbanking / wallet inputs are Cashfree-hosted iframes ("Web Elements"), so raw
 * payment data never touches our pages or servers. The SDK must be loaded from Cashfree's CDN
 * (not bundled or self-hosted) to stay PCI compliant.
 */

export type CashfreeMode = "sandbox" | "production";

export interface CfComponentData {
  value?: Record<string, unknown>;
  complete?: boolean;
  invalid?: boolean;
  empty?: boolean;
  ready?: boolean;
  error?: { message?: string };
}

export interface CfComponent {
  mount: (target: string | HTMLElement) => void;
  unmount: () => void;
  destroy: () => void;
  on: (event: string, cb: (d?: unknown) => void) => void;
  data: () => CfComponentData;
}

export interface CfPayResult {
  error?: { message?: string; code?: string };
  redirect?: boolean;
  paymentDetails?: { paymentMessage?: string };
}

export interface CashfreeSDK {
  create: (type: string, options?: { values?: Record<string, unknown> }) => CfComponent;
  pay: (o: {
    paymentMethod: CfComponent;
    paymentSessionId: string;
    returnUrl?: string;
    redirect?: "if_required" | "always";
  }) => Promise<CfPayResult>;
  checkout: (o: { paymentSessionId: string; returnUrl?: string; redirectTarget?: "_self" | "_blank" | "_modal" }) => Promise<CfPayResult>;
}

declare global {
  interface Window {
    Cashfree?: (cfg: { mode: CashfreeMode }) => CashfreeSDK;
  }
}

const SCRIPT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";
let scriptPromise: Promise<boolean> | null = null;
const instances: Partial<Record<CashfreeMode, CashfreeSDK>> = {};

function loadScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(!!window.Cashfree);
    s.onerror = () => {
      scriptPromise = null; // allow a retry
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Returns the SDK for the mode the server told us to use, or null if it could not be loaded. */
export async function loadCashfree(mode: CashfreeMode): Promise<CashfreeSDK | null> {
  if (instances[mode]) return instances[mode]!;
  if (!(await loadScript()) || !window.Cashfree) return null;
  try {
    instances[mode] = window.Cashfree({ mode });
    return instances[mode]!;
  } catch {
    return null;
  }
}

/** Where Cashfree sends the customer afterwards. Our page asks the SERVER what really happened. */
export const returnUrlFor = (orderNumber: string) =>
  `${window.location.origin}/payment/return?order_id=${encodeURIComponent(orderNumber)}`;

/** Netbanking bank names (Cashfree `netbankingBankName`) for the most-used banks. */
export const POPULAR_BANKS = [
  { name: "HDFCR", label: "HDFC Bank" },
  { name: "ICICR", label: "ICICI Bank" },
  { name: "SBINR", label: "State Bank of India" },
  { name: "UTIBR", label: "Axis Bank" },
  { name: "KKBKR", label: "Kotak Mahindra Bank" },
  { name: "YESBR", label: "Yes Bank" },
] as const;

export const WALLETS = [
  { provider: "phonepe", label: "PhonePe" },
  { provider: "paytm", label: "Paytm" },
  { provider: "amazon", label: "Amazon Pay" },
  { provider: "freecharge", label: "Freecharge" },
  { provider: "mobikwik", label: "MobiKwik" },
] as const;

export const UPI_APPS = [
  { upiApp: "gpay", label: "Google Pay" },
  { upiApp: "phonepe", label: "PhonePe" },
  { upiApp: "paytm", label: "Paytm" },
] as const;
