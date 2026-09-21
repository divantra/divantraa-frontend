"use client";

import { Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import { rupees, type Quote } from "@/hooks/useQuote";
import type { PaymentChoice } from "@/components/checkout/PaymentStep";

/**
 * Simple payment step: one "Pay securely" button that sends the customer to Cashfree's own payment page, which
 * offers every method (UPI apps & QR, cards, netbanking, wallets, pay-later…) with the brand logos.
 * Cash on delivery stays available as a small link, not a section.
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
  const isCod = selected === "cod" && codOk;
  // If online payments are unavailable the only way to order is cash on delivery.
  const useCod = isCod || (!onlineOk && codOk);
  const total = useCod ? cod?.total : online?.total;
  const saving = onlineOk && online && cod && cod.total > online.total ? cod.total - online.total : 0;

  return (
    <section aria-label="Payment" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Payment</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
          <ShieldCheck size={14} className="text-leaf" /> Secured by Cashfree
        </span>
      </div>

      {!onlineOk && quote && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Online payments are temporarily unavailable. You can still pay on delivery.</p>
      )}

      {!useCod ? (
        <>
          <p className="flex items-start gap-2 text-sm text-ink/60">
            <Lock size={14} className="mt-0.5 shrink-0 text-leaf" />
            You&apos;ll choose how to pay — UPI, card, netbanking or wallet — on Cashfree&apos;s secure payment page. Your payment details go
            straight to Cashfree and never touch our servers.
          </p>
          {pct > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              <Check size={12} /> Extra {pct}% off when you pay online
            </span>
          )}
        </>
      ) : (
        <p className="text-sm text-ink/60">
          Keep {cod ? rupees(cod.total) : "the amount"} ready in cash when your order arrives (includes {cod ? rupees(cod.codFee) : "the"} COD handling fee).
        </p>
      )}

      <button
        type="button" onClick={onPay} disabled={busy || !quote || (useCod ? !codOk : !onlineOk)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <><Loader2 size={18} className="animate-spin" /> Processing…</>
        ) : (
          <>{!useCod && <Lock size={16} />}{useCod ? `Place order · ${total != null ? rupees(total) : ""}` : `Pay ${total != null ? rupees(total) : ""} securely`}</>
        )}
      </button>

      {/* Cash on delivery: a link, not a section */}
      {codOk && onlineOk && (
        <p className="text-center text-xs text-ink/50">
          {useCod ? (
            <button type="button" onClick={() => onSelect("upi")} className="font-medium text-forest underline">
              Pay online instead{saving > 0 ? ` and save ${rupees(saving)}` : ""}
            </button>
          ) : (
            <button type="button" onClick={() => onSelect("cod")} className="font-medium text-forest underline">
              Prefer cash on delivery? ({cod ? rupees(cod.total) : ""} incl. {cod ? rupees(cod.codFee) : ""} fee)
            </button>
          )}
        </p>
      )}
      <p className="text-center text-xs text-ink/40">By continuing you agree to our terms and conditions. Payments are processed by Cashfree.</p>
    </section>
  );
}
