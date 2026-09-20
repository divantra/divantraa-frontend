"use client";

import type { ReactNode } from "react";
import { Banknote, Check, ChevronRight, CreditCard, Landmark, Lock, ShieldCheck, Smartphone, Wallet, Loader2 } from "lucide-react";
import { rupees, type Quote } from "@/hooks/useQuote";

export type PaymentChoice = "upi" | "card" | "netbanking" | "wallet" | "cod";

/** Razorpay bank codes for the most-used netbanking banks. */
export const POPULAR_BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "SBIN", name: "State Bank of India" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
] as const;

export const isValidVpa = (v: string) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v.trim());

interface Props {
  quote: Quote | undefined;
  selected: PaymentChoice;
  onSelect: (c: PaymentChoice) => void;
  upiId: string;
  onUpiId: (v: string) => void;
  bank: string | null;
  onBank: (code: string | null) => void;
  busy: boolean;
  onPay: () => void;
}

export default function PaymentStep({ quote, selected, onSelect, upiId, onUpiId, bank, onBank, busy, onPay }: Props) {
  const online = quote?.methods.online;
  const cod = quote?.methods.cod;
  const onlineOk = !!online?.enabled;
  const codOk = !!cod?.enabled;
  const pct = quote?.onlineDiscountPercent ?? 0;
  const onlineAmount = online ? rupees(online.total) : "—";
  const upiInvalid = selected === "upi" && upiId.trim() !== "" && !isValidVpa(upiId);

  const payAmount = selected === "cod" ? cod?.total : online?.total;
  const payLabel =
    selected === "cod" ? `Place order · ${payAmount != null ? rupees(payAmount) : ""}` : `Pay ${payAmount != null ? rupees(payAmount) : ""} securely`;

  const chip = pct > 0 ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <Check size={11} /> Extra {pct}% off
    </span>
  ) : null;

  return (
    <section aria-label="Payment options" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Payment options</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
          <ShieldCheck size={14} className="text-leaf" /> Secured by Razorpay
        </span>
      </div>

      {!onlineOk && quote && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Online payments are temporarily unavailable. You can still pay on delivery.
        </p>
      )}

      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        {/* Suggested: UPI */}
        <div className={`overflow-hidden rounded-2xl border-2 ${selected === "upi" ? "border-forest" : "border-ink/10"} ${!onlineOk ? "opacity-50" : ""}`}>
          {onlineOk && <p className="bg-forest px-4 py-1.5 text-center text-xs font-semibold text-white">Suggested payment method</p>}
          <MethodRow
            id="upi" selected={selected === "upi"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Smartphone size={20} />} title="Pay via UPI" subtitle="Google Pay, PhonePe, Paytm, BHIM & any UPI app"
            amount={onlineAmount} chip={chip} bare
          >
            <label htmlFor="upi-id" className="mb-1 block text-xs text-ink/50">UPI ID (optional)</label>
            <input
              id="upi-id" value={upiId} onChange={(e) => onUpiId(e.target.value)} inputMode="email" autoComplete="off"
              placeholder="yourname@bank"
              aria-invalid={upiInvalid}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${upiInvalid ? "border-red-400" : "border-ink/15 focus:border-leaf"}`}
            />
            {upiInvalid ? (
              <p className="mt-1 text-xs text-red-500">Enter a valid UPI ID like name@okhdfcbank.</p>
            ) : (
              <p className="mt-1 text-xs text-ink/40">Skip this to pick a UPI app or scan a QR code on the next screen.</p>
            )}
          </MethodRow>
        </div>

        <div className={`overflow-hidden rounded-2xl border-2 ${selected === "netbanking" ? "border-forest" : "border-ink/10"} ${!onlineOk ? "opacity-50" : ""}`}>
          <MethodRow
            id="netbanking" selected={selected === "netbanking"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Landmark size={20} />} title="Netbanking" subtitle="Select from a list of banks"
            amount={onlineAmount} chip={chip} bare
          >
            <p className="mb-2 text-xs text-ink/50">Popular banks</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {POPULAR_BANKS.map((b) => (
                <button
                  key={b.code} type="button" onClick={() => onBank(b.code)} aria-pressed={bank === b.code}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${bank === b.code ? "border-forest bg-leaf/5 text-forest" : "border-ink/15 text-ink/70 hover:border-ink/30"}`}
                >
                  {b.name}
                </button>
              ))}
              <button
                type="button" onClick={() => onBank(null)} aria-pressed={bank === null}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${bank === null ? "border-forest bg-leaf/5 text-forest" : "border-ink/15 text-ink/70 hover:border-ink/30"}`}
              >
                Other banks
              </button>
            </div>
          </MethodRow>
        </div>

        <div className={`overflow-hidden rounded-2xl border-2 ${selected === "card" ? "border-forest" : "border-ink/10"} ${!onlineOk ? "opacity-50" : ""}`}>
          <MethodRow
            id="card" selected={selected === "card"} disabled={!onlineOk} onSelect={onSelect}
            icon={<CreditCard size={20} />} title="Debit / Credit cards" subtitle="Visa, Mastercard, RuPay, Amex & more"
            amount={onlineAmount} chip={chip} bare
          >
            <p className="flex items-start gap-2 text-xs text-ink/60">
              <Lock size={13} className="mt-0.5 shrink-0 text-leaf" />
              You&apos;ll enter your card details in Razorpay&apos;s secure window. We never see or store your card number, expiry or CVV.
            </p>
          </MethodRow>
        </div>

        <div className={`overflow-hidden rounded-2xl border-2 ${selected === "wallet" ? "border-forest" : "border-ink/10"} ${!onlineOk ? "opacity-50" : ""}`}>
          <MethodRow
            id="wallet" selected={selected === "wallet"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Wallet size={20} />} title="Wallets" subtitle="Pay with your mobile wallet"
            amount={onlineAmount} chip={chip} bare
          >
            <p className="text-xs text-ink/60">Choose your wallet on the next screen and approve the payment in its app.</p>
          </MethodRow>
        </div>

        <div className={`overflow-hidden rounded-2xl border-2 ${selected === "cod" ? "border-forest" : "border-ink/10"} ${!codOk ? "opacity-50" : ""}`}>
          <MethodRow
            id="cod" selected={selected === "cod"} disabled={!codOk} onSelect={onSelect}
            icon={<Banknote size={20} />} title="Cash on delivery" subtitle={cod ? `Includes ${rupees(cod.codFee)} COD handling fee` : "Pay when your order arrives"}
            amount={cod ? rupees(cod.total) : "—"} bare
          >
            <p className="text-xs text-ink/60">
              Keep {cod ? rupees(cod.total) : "the amount"} ready in cash when your order arrives.
              {onlineOk && online && cod && cod.total > online.total && (
                <> Pay online instead and save <span className="font-medium text-green-700">{rupees(cod.total - online.total)}</span>.</>
              )}
            </p>
          </MethodRow>
        </div>
      </div>

      <button
        type="button" onClick={onPay}
        disabled={busy || !quote || upiInvalid || (selected === "cod" ? !codOk : !onlineOk)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>{selected !== "cod" && <Lock size={16} />}{payLabel}</>}
      </button>
      <p className="text-center text-xs text-ink/40">
        By continuing you agree to our terms and conditions. Payments are processed by Razorpay.
      </p>
    </section>
  );
}

function MethodRow(props: {
  id: PaymentChoice; selected: boolean; disabled?: boolean; onSelect: (c: PaymentChoice) => void;
  icon: ReactNode; title: string; subtitle: string; amount: string; chip?: ReactNode; children: ReactNode; bare?: boolean;
}) {
  const { id, selected, disabled, onSelect, icon, title, subtitle, amount, chip, children } = props;
  return (
    <div className="bg-white">
      <button
        type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={() => onSelect(id)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:cursor-not-allowed"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? "bg-forest text-white" : "bg-ink/5 text-ink/60"}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="block text-xs text-ink/50">{subtitle}</span>
          {chip && <span className="mt-1.5 block">{chip}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
          {amount}
          <ChevronRight size={16} className={`text-ink/30 transition-transform ${selected ? "rotate-90" : ""}`} />
        </span>
      </button>
      {selected && !disabled && <div className="border-t border-ink/8 bg-ink/[0.02] px-4 py-4">{children}</div>}
    </div>
  );
}
