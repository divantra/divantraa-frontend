"use client";

import { useState, type ReactNode } from "react";
import { Banknote, Check, ChevronRight, CreditCard, Landmark, Loader2, Lock, Search, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { rupees, type Quote } from "@/hooks/useQuote";
import CardForm from "@/components/checkout/CardForm";
import { isCardValid, type CardValue } from "@/lib/card";
import type { CustomMethods } from "@/lib/razorpayCustom";

export type PaymentChoice = "upi" | "card" | "netbanking" | "wallet" | "cod";

/** Razorpay bank codes for the most-used netbanking banks. */
export const POPULAR_BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "SBIN", name: "State Bank of India" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
] as const;

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

interface Props {
  quote: Quote | undefined;
  selected: PaymentChoice;
  onSelect: (c: PaymentChoice) => void;
  /** null = Razorpay Custom Checkout unavailable → we fall back to the hosted window. */
  custom: CustomMethods | null;
  card: CardValue;
  onCard: (c: CardValue) => void;
  bank: string | null;
  onBank: (code: string | null) => void;
  wallet: string | null;
  onWallet: (code: string | null) => void;
  email: string;
  onEmail: (v: string) => void;
  needsEmail: boolean;
  busy: boolean;
  onPay: () => void;
}

/** True when the chosen method's own inputs are complete (custom flows only). */
export function isChoiceReady(p: Pick<Props, "selected" | "custom" | "card" | "bank" | "wallet">): boolean {
  if (!p.custom) return true;
  if (p.selected === "card") return isCardValid(p.card);
  if (p.selected === "netbanking") return !!p.bank;
  if (p.selected === "wallet") return !!p.wallet;
  return true;
}

export default function PaymentStep(p: Props) {
  const { quote, selected, onSelect, custom, busy, onPay } = p;
  const online = quote?.methods.online;
  const cod = quote?.methods.cod;
  const onlineOk = !!online?.enabled;
  const codOk = !!cod?.enabled;
  const pct = quote?.onlineDiscountPercent ?? 0;
  const onlineAmount = online ? rupees(online.total) : "—";
  const emailBad = selected !== "cod" && p.needsEmail && !isValidEmail(p.email);
  const ready = isChoiceReady(p) && !emailBad;

  const payAmount = selected === "cod" ? cod?.total : online?.total;
  const payLabel = selected === "cod" ? `Place order · ${payAmount != null ? rupees(payAmount) : ""}` : `Pay ${payAmount != null ? rupees(payAmount) : ""} securely`;

  const chip = pct > 0 ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <Check size={11} /> Extra {pct}% off
    </span>
  ) : null;

  const box = (id: PaymentChoice, disabled: boolean) =>
    `overflow-hidden rounded-2xl border-2 ${selected === id ? "border-forest" : "border-ink/10"} ${disabled ? "opacity-50" : ""}`;

  return (
    <section aria-label="Payment options" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Payment options</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
          <ShieldCheck size={14} className="text-leaf" /> Secured by Razorpay
        </span>
      </div>

      {!onlineOk && quote && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Online payments are temporarily unavailable. You can still pay on delivery.</p>
      )}

      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        {/* Suggested: UPI (secure window: app on mobile, QR on desktop) */}
        <div className={box("upi", !onlineOk)}>
          {onlineOk && <p className="bg-forest px-4 py-1.5 text-center text-xs font-semibold text-white">Suggested payment method</p>}
          <MethodRow id="upi" selected={selected === "upi"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Smartphone size={20} />} title="Pay via UPI" subtitle="Google Pay, PhonePe, Paytm, BHIM & any UPI app"
            amount={onlineAmount} chip={chip}>
            <p className="text-xs text-ink/60">
              Tap Pay to continue in a secure window — choose your UPI app on mobile, or scan the QR code with any UPI app.
            </p>
          </MethodRow>
        </div>

        <div className={box("netbanking", !onlineOk)}>
          <MethodRow id="netbanking" selected={selected === "netbanking"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Landmark size={20} />} title="Netbanking" subtitle="Pay from your bank account" amount={onlineAmount} chip={chip}>
            <BankPicker custom={custom} bank={p.bank} onBank={p.onBank} />
          </MethodRow>
        </div>

        <div className={box("card", !onlineOk)}>
          <MethodRow id="card" selected={selected === "card"} disabled={!onlineOk} onSelect={onSelect}
            icon={<CreditCard size={20} />} title="Debit / Credit cards" subtitle="Visa, Mastercard, RuPay, Amex & more" amount={onlineAmount} chip={chip}>
            {custom ? (
              <CardForm value={p.card} onChange={p.onCard} />
            ) : (
              <p className="flex items-start gap-2 text-xs text-ink/60">
                <Lock size={13} className="mt-0.5 shrink-0 text-leaf" />
                You&apos;ll enter your card details in Razorpay&apos;s secure window. We never see or store them.
              </p>
            )}
          </MethodRow>
        </div>

        <div className={box("wallet", !onlineOk)}>
          <MethodRow id="wallet" selected={selected === "wallet"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Wallet size={20} />} title="Wallets" subtitle="Pay with your mobile wallet" amount={onlineAmount} chip={chip}>
            {custom && custom.wallets.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {custom.wallets.map((w) => (
                  <button key={w.code} type="button" onClick={() => p.onWallet(w.code)} aria-pressed={p.wallet === w.code}
                    className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${p.wallet === w.code ? "border-forest bg-leaf/5 text-forest" : "border-ink/15 text-ink/70 hover:border-ink/30"}`}>
                    {w.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink/60">Choose your wallet in the next screen and approve the payment in its app.</p>
            )}
          </MethodRow>
        </div>

        <div className={box("cod", !codOk)}>
          <MethodRow id="cod" selected={selected === "cod"} disabled={!codOk} onSelect={onSelect}
            icon={<Banknote size={20} />} title="Cash on delivery"
            subtitle={cod ? `Includes ${rupees(cod.codFee)} COD handling fee` : "Pay when your order arrives"} amount={cod ? rupees(cod.total) : "—"}>
            <p className="text-xs text-ink/60">
              Keep {cod ? rupees(cod.total) : "the amount"} ready in cash when your order arrives.
              {onlineOk && online && cod && cod.total > online.total && (
                <> Pay online instead and save <span className="font-medium text-green-700">{rupees(cod.total - online.total)}</span>.</>
              )}
            </p>
          </MethodRow>
        </div>
      </div>

      {selected !== "cod" && p.needsEmail && (
        <div>
          <label htmlFor="pay-email" className="mb-1 block text-xs text-ink/50">Email for your payment receipt</label>
          <input id="pay-email" type="email" autoComplete="email" value={p.email} onChange={(e) => p.onEmail(e.target.value)} placeholder="you@example.com"
            aria-invalid={p.email !== "" && emailBad}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${p.email !== "" && emailBad ? "border-red-400" : "border-ink/15 focus:border-leaf"}`} />
        </div>
      )}

      <button type="button" onClick={onPay}
        disabled={busy || !quote || !ready || (selected === "cod" ? !codOk : !onlineOk)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
        {busy ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>{selected !== "cod" && <Lock size={16} />}{payLabel}</>}
      </button>
      <p className="text-center text-xs text-ink/40">By continuing you agree to our terms and conditions. Payments are processed by Razorpay.</p>
    </section>
  );
}

function BankPicker({ custom, bank, onBank }: { custom: CustomMethods | null; bank: string | null; onBank: (c: string | null) => void }) {
  const [q, setQ] = useState("");
  const btn = (active: boolean) =>
    `rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${active ? "border-forest bg-leaf/5 text-forest" : "border-ink/15 text-ink/70 hover:border-ink/30"}`;

  // Hosted fallback: popular banks pre-select a bank in Razorpay's window, "Other" lets them choose there.
  if (!custom) {
    return (
      <>
        <p className="mb-2 text-xs text-ink/50">Popular banks</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {POPULAR_BANKS.map((b) => (
            <button key={b.code} type="button" onClick={() => onBank(b.code)} aria-pressed={bank === b.code} className={btn(bank === b.code)}>{b.name}</button>
          ))}
          <button type="button" onClick={() => onBank(null)} aria-pressed={bank === null} className={btn(bank === null)}>Other banks</button>
        </div>
      </>
    );
  }

  const popular = POPULAR_BANKS.filter((pb) => custom.banks.some((b) => b.code === pb.code));
  const list = custom.banks.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      {!q && popular.length > 0 && (
        <>
          <p className="mb-2 text-xs text-ink/50">Popular banks</p>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {popular.map((b) => (
              <button key={b.code} type="button" onClick={() => onBank(b.code)} aria-pressed={bank === b.code} className={btn(bank === b.code)}>{b.name}</button>
            ))}
          </div>
        </>
      )}
      <label htmlFor="bank-search" className="sr-only">Search banks</label>
      <div className="relative mb-2">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input id="bank-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all banks"
          className="w-full rounded-lg border border-ink/15 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-leaf" />
      </div>
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-ink/10 bg-white p-1">
        {list.length === 0 && <p className="p-3 text-xs text-ink/50">No bank found.</p>}
        {list.map((b) => (
          <button key={b.code} type="button" onClick={() => onBank(b.code)} aria-pressed={bank === b.code}
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${bank === b.code ? "bg-leaf/10 font-medium text-forest" : "text-ink/80 hover:bg-ink/5"}`}>
            {b.name}{bank === b.code && <Check size={14} />}
          </button>
        ))}
      </div>
    </>
  );
}

function MethodRow(props: {
  id: PaymentChoice; selected: boolean; disabled?: boolean; onSelect: (c: PaymentChoice) => void;
  icon: ReactNode; title: string; subtitle: string; amount: string; chip?: ReactNode; children: ReactNode;
}) {
  const { id, selected, disabled, onSelect, icon, title, subtitle, amount, chip, children } = props;
  return (
    <div className="bg-white">
      <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={() => onSelect(id)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:cursor-not-allowed">
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
