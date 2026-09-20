/**
 * Card-form helpers (pure functions, no I/O).
 *
 * SECURITY: card numbers, expiry and CVV must only ever live in component
 * state and be handed straight to Razorpay's script. Never log them, never
 * put them in a URL/storage/analytics event, never send them to our API.
 */

export type CardBrand = "visa" | "mastercard" | "amex" | "rupay" | "unknown";

export const digitsOnly = (v: string) => v.replace(/\D/g, "");

export function detectBrand(number: string): CardBrand {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(60|65|81|82|508)/.test(n)) return "rupay";
  return "unknown";
}

export const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa", mastercard: "Mastercard", amex: "Amex", rupay: "RuPay", unknown: "",
};

export const maxCardLength = (brand: CardBrand) => (brand === "amex" ? 15 : 16);
export const cvvLength = (brand: CardBrand) => (brand === "amex" ? 4 : 3);

/** "4111111111111111" -> "4111 1111 1111 1111" (Amex: 4-6-5). */
export function formatCardNumber(raw: string): string {
  const n = digitsOnly(raw).slice(0, maxCardLength(detectBrand(raw)));
  if (detectBrand(n) === "amex") return [n.slice(0, 4), n.slice(4, 10), n.slice(10)].filter(Boolean).join(" ");
  return n.replace(/(.{4})/g, "$1 ").trim();
}

export function luhnValid(number: string): boolean {
  const n = digitsOnly(number);
  if (n.length < 13 || n.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

/** Typing "1226" -> "12/26"; a lone "3".."9" becomes "03/". */
export function formatExpiry(raw: string): string {
  let d = digitsOnly(raw).slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d.length === 2 && raw.length > 2 ? `${d}/` : d;
}

export function parseExpiry(v: string): { month: number; year: number } | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(v);
  if (!m) return null;
  return { month: Number(m[1]), year: 2000 + Number(m[2]) };
}

export function expiryValid(v: string, now = new Date()): boolean {
  const e = parseExpiry(v);
  if (!e || e.month < 1 || e.month > 12) return false;
  const endOfMonth = new Date(e.year, e.month, 0, 23, 59, 59);
  return endOfMonth >= now && e.year <= now.getFullYear() + 20;
}

export interface CardValue { number: string; name: string; expiry: string; cvv: string }
export const emptyCard: CardValue = { number: "", name: "", expiry: "", cvv: "" };

export interface CardErrors { number?: string; name?: string; expiry?: string; cvv?: string }

export function validateCard(c: CardValue, now = new Date()): CardErrors {
  const brand = detectBrand(c.number);
  const errs: CardErrors = {};
  if (!luhnValid(c.number)) errs.number = "Enter a valid card number.";
  if (c.name.trim().length < 2) errs.name = "Enter the name on the card.";
  if (!expiryValid(c.expiry, now)) errs.expiry = "Enter a valid expiry (MM/YY).";
  if (digitsOnly(c.cvv).length !== cvvLength(brand)) errs.cvv = `Enter the ${cvvLength(brand)}-digit CVV.`;
  return errs;
}

export const isCardValid = (c: CardValue) => Object.keys(validateCard(c)).length === 0;
