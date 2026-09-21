import { api } from "@/lib/api";

/**
 * Non-card payment methods are started SERVER-SIDE (POST /orders/pay -> Cashfree "Order Pay"), so the
 * checkout can show a QR, open a UPI app or redirect to a bank without Cashfree's hosted iframes.
 * Card details never come through here — cards use Cashfree's hosted fields.
 */

/** Cashfree bank codes for the most-used netbanking banks. */
export const BANKS = [
  { code: 3021, label: "HDFC Bank", logo: "hdfc" },
  { code: 3022, label: "ICICI Bank", logo: "icici" },
  { code: 3044, label: "State Bank of India", logo: "sbi" },
  { code: 3003, label: "Axis Bank", logo: "axis" },
  { code: 3032, label: "Kotak Mahindra Bank", logo: "kotak" },
  { code: 3058, label: "Yes Bank", logo: "yes" },
  { code: 3038, label: "Punjab National Bank", logo: "pnb" },
  { code: 3005, label: "Bank of Baroda", logo: "bob" },
] as const;

/** Only offered in sandbox: lets you complete a netbanking test payment. */
export const TEST_BANK = { code: 3333, label: "Test Bank (sandbox)", logo: "" } as const;

export const WALLETS = [
  { provider: "phonepe", label: "PhonePe" },
  { provider: "paytm", label: "Paytm" },
  { provider: "amazon", label: "Amazon Pay" },
  { provider: "freecharge", label: "Freecharge" },
  { provider: "mobikwik", label: "MobiKwik" },
] as const;

/** UPI apps that can be opened directly on a phone. */
export const UPI_APPS = [
  { key: "gpay", label: "Google Pay" },
  { key: "phonepe", label: "PhonePe" },
  { key: "paytm", label: "Paytm" },
  { key: "bhim", label: "BHIM" },
] as const;

export const isValidVpa = (v: string) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v.trim());
export const isValidMobile = (v: string) => /^[6-9]\d{9}$/.test(v);

export type PayStart =
  | { kind: "qr"; qrImage: string; expiresInSeconds: number }
  | { kind: "intent"; links: Partial<Record<"default" | "gpay" | "phonepe" | "paytm" | "bhim" | "web", string>> }
  | { kind: "collect"; expiresInSeconds: number }
  | { kind: "redirect"; url: string };

export type PayBody =
  | { method: "upi_qr" }
  | { method: "upi_intent" }
  | { method: "upi_collect"; upiId: string }
  | { method: "netbanking"; bankCode: number }
  | { method: "wallet"; provider: string; phone: string };

export async function startInlinePayment(orderNumber: string, body: PayBody): Promise<PayStart> {
  const { data } = await api.post<{ data: PayStart }>("/orders/pay", { orderNumber, ...body });
  return data.data;
}

export type PayStatus =
  | { status: "PAID"; orderId: string }
  | { status: "PENDING" }
  | { status: "FAILED"; reason: string }
  | { status: "EXPIRED" };

export async function fetchPayStatus(orderNumber: string): Promise<PayStatus> {
  const { data } = await api.get<{ data: PayStatus }>(`/orders/payment-status/${encodeURIComponent(orderNumber)}`);
  return data.data;
}
