/**
 * Razorpay CUSTOM Checkout (razorpay.js): our own card / netbanking / wallet UI.
 *
 * Card details go from the browser straight to Razorpay through this script —
 * they must never be sent to our own API. After 3-D Secure Razorpay redirects the
 * browser to our /orders/payment-callback endpoint, which verifies the signature.
 *
 * NOTE: requires Razorpay to enable Custom Checkout for the account and the site
 * domain to be registered. If it is not available, callers fall back to the hosted
 * window in lib/razorpay.ts (initCustomCheckout resolves null).
 */
import type { CardValue } from "@/lib/card";
import { digitsOnly, parseExpiry } from "@/lib/card";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/razorpay.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
let ctor: any = null;
let scriptPromise: Promise<any> | null = null;

/** checkout.js and razorpay.js both write window.Razorpay, so keep our own reference. */
function loadCustomScript(): Promise<any> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (ctor) return Promise.resolve(ctor);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => { ctor = (window as any).Razorpay ?? null; resolve(ctor); };
    s.onerror = () => { scriptPromise = null; resolve(null); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export interface NamedOption { code: string; name: string }
export interface CustomMethods { banks: NamedOption[]; wallets: NamedOption[] }

const WALLET_NAMES: Record<string, string> = {
  freecharge: "Freecharge", mobikwik: "MobiKwik", olamoney: "Ola Money", payzapp: "PayZapp",
  airtelmoney: "Airtel Money", jiomoney: "JioMoney", amazonpay: "Amazon Pay", phonepe: "PhonePe", paytm: "Paytm",
};

function toOptions(src: unknown, names?: Record<string, string>): NamedOption[] {
  if (!src) return [];
  const out: NamedOption[] = [];
  if (Array.isArray(src)) {
    for (const i of src) {
      if (typeof i === "string") out.push({ code: i, name: names?.[i] ?? i });
      else if (i && typeof i === "object") out.push({ code: String((i as any).code ?? (i as any).id), name: String((i as any).name ?? (i as any).code) });
    }
  } else if (typeof src === "object") {
    for (const [code, v] of Object.entries(src as Record<string, unknown>)) {
      if (v === false || v == null) continue;
      const name = typeof v === "string" ? v : typeof v === "object" && (v as any).name ? String((v as any).name) : names?.[code] ?? code;
      out.push({ code, name: names?.[code] ?? name });
    }
  }
  return out.filter((o) => o.code && o.code !== "undefined").sort((a, b) => a.name.localeCompare(b.name));
}

export interface PayData {
  amount: number;            // paise, exactly as returned by the server
  currency: string;
  orderId: string;           // razorpay order id
  email: string;
  contact: string;
  callbackUrl: string;       // absolute URL of /api/v1/orders/payment-callback
  method: "card" | "netbanking" | "wallet";
  card?: CardValue;
  bank?: string;
  wallet?: string;
}

export interface CustomClient {
  methods: CustomMethods;
  pay: (d: PayData, onError: (message: string) => void) => void;
}

/** Resolves null when Custom Checkout is unavailable (script blocked, not enabled, timeout). */
export async function initCustomCheckout(keyId: string): Promise<CustomClient | null> {
  const C = await loadCustomScript();
  if (!C || !keyId) return null;

  let inst: any;
  try {
    inst = new C({ key: keyId, redirect: true });
  } catch {
    return null;
  }

  const raw: any = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), 8000);
    try {
      inst.once("ready", (r: any) => { clearTimeout(t); resolve(r?.methods ?? null); });
    } catch {
      clearTimeout(t);
      resolve(null);
    }
  });
  if (!raw) return null;

  const methods: CustomMethods = { banks: toOptions(raw.netbanking), wallets: toOptions(raw.wallet, WALLET_NAMES) };

  return {
    methods,
    pay(d, onError) {
      inst.on("payment.error", (r: any) => onError(r?.error?.description ?? "The payment could not be completed."));
      const base: Record<string, unknown> = {
        amount: d.amount, currency: d.currency, order_id: d.orderId, email: d.email, contact: d.contact,
        method: d.method, callback_url: d.callbackUrl, redirect: true,
      };
      if (d.method === "card" && d.card) {
        const exp = parseExpiry(d.card.expiry);
        base.card = {
          number: digitsOnly(d.card.number), name: d.card.name.trim(),
          expiry_month: exp?.month, expiry_year: exp ? exp.year % 100 : undefined, cvv: digitsOnly(d.card.cvv),
        };
      } else if (d.method === "netbanking") base.bank = d.bank;
      else if (d.method === "wallet") base.wallet = d.wallet;
      inst.createPayment(base);
    },
  };
}
