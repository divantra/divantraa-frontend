"use client";

import { Banknote, Check, ChevronRight, Loader2, Lock, ShieldCheck, Smartphone } from "lucide-react";
import type { ReactNode } from "react";
import { rupees, type Quote } from "@/hooks/useQuote";
import type { PaymentChoice } from "@/components/checkout/PaymentStep";

/**
 * Simple payment step: "Pay online" sends the customer to Cashfree's own secure payment page, which offers every
 * method (UPI apps, QR, cards, netbanking, wallets, pay-later…) with the brand logos. Cash on delivery is unchanged.
 *
 * The richer in-page checkout (PaymentStep) is kept as a fallback — switch with NEXT_PUBLIC_PAYMENT_UI=custom.
 */
export default function HostedPaymentStep(props: {
  quote: Quote | undefined;
  selected: PaymentChoice;
  onSelect: (c: PaymentChoice) => void;
  busy: boolean;
  onPay: () => void;
}) {
  const { quote, selected, onSelect, busy, onPay } = props;
  const online = quote?.methods.online;
  const cod = quote?.methods.cod;
  const onlineOk = !!online?.enabled;
  const codOk = !!cod?.enabled;
  const pct = quote?.onlineDiscountPercent ?? 0;
  const isOnline = selected !== "cod";
  const payAmount = isOnline ? online?.total : cod?.total;

  const chip = pct > 0 ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <Check size={11} /> Extra {pct}% off
    </span>
  ) : null;

  return (
    <section aria-label="Payment options" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Payment method</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
          <ShieldCheck size={14} className="text-leaf" /> Secured by Cashfree
        </span>
      </div>

      {!onlineOk && quote && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Online payments are temporarily unavailable. You can still pay on delivery.</p>
      )}

      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        <Row
          selected={isOnline} disabled={!onlineOk} onClick={() => onSelect("upi")}
          icon={<Smartphone size={20} />} title="Pay online" subtitle="UPI apps & QR, cards, netbanking, wallets and more"
          amount={online ? rupees(online.total) : "—"} chip={chip}
        >
          <p className="flex items-start gap-2 text-xs text-ink/60">
            <Lock size={13} className="mt-0.5 shrink-0 text-leaf" />
            You&apos;ll choose how to pay — UPI, card, netbanking or wallet — on Cashfree&apos;s secure payment page. Your payment details go
            straight to Cashfree and never touch our servers.
          </p>
        </Row>

        <Row
          selected={!isOnline} disabled={!codOk} onClick={() => onSelect("cod")}
          icon={<Banknote size={20} />} title="Cash on delivery"
          subtitle={cod ? `Includes ${rupees(cod.codFee)} COD handling fee` : "Pay when your order arrives"} amount={cod ? rupees(cod.total) : "—"}
        >
          <p className="text-xs text-ink/60">
            Keep {cod ? rupees(cod.total) : "the amount"} ready in cash when your order arrives.
            {onlineOk && online && cod && cod.total > online.total && (
              <> Pay online instead and save <span className="font-medium text-green-700">{rupees(cod.total - online.total)}</span>.</>
            )}
          </p>
        </Row>
      </div>

      <button
        type="button" onClick={onPay} disabled={busy || !quote || (isOnline ? !onlineOk : !codOk)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <><Loader2 size={18} className="animate-spin" /> Processing…</>
        ) : (
          <>{isOnline && <Lock size={16} />}{isOnline ? `Pay ${payAmount != null ? rupees(payAmount) : ""} securely` : `Place order · ${payAmount != null ? rupees(payAmount) : ""}`}</>
        )}
      </button>
      <p className="text-center text-xs text-ink/40">By continuing you agree to our terms and conditions. Payments are processed by Cashfree.</p>
    </section>
  );
}

function Row(props: {
  selected: boolean; disabled?: boolean; onClick: () => void; icon: ReactNode; title: string; subtitle: string;
  amount: string; chip?: ReactNode; children: ReactNode;
}) {
  const { selected, disabled, onClick, icon, title, subtitle, amount, chip, children } = props;
  return (
    <div className={`overflow-hidden rounded-2xl border-2 bg-white ${selected ? "border-forest" : "border-ink/10"} ${disabled ? "opacity-50" : ""}`}>
      <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={onClick}
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
