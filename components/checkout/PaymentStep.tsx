"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Banknote, Check, ChevronRight, CreditCard, Landmark, Loader2, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { rupees, type Quote } from "@/hooks/useQuote";
import { CfButton, CfField, type FieldState } from "@/components/checkout/CfParts";
import { POPULAR_BANKS, UPI_APPS, WALLETS, type CashfreeSDK, type CfComponent } from "@/lib/cashfree";

export type PaymentChoice = "upi" | "card" | "netbanking" | "wallet" | "cod";

/** What the parent needs to take the payment: which Cashfree component to pay with (or hosted checkout). */
export interface Selection {
  component: CfComponent | null;
  ready: boolean;
  hosted: boolean;
}

interface Props {
  quote: Quote | undefined;
  selected: PaymentChoice;
  onSelect: (c: PaymentChoice) => void;
  sdk: CashfreeSDK | null;
  sdkStatus: "loading" | "ready" | "failed";
  onSelection: (s: Selection) => void;
  busy: boolean;
  onPay: () => void;
  /** Open Cashfree's own checkout (all banks / QR / every UPI app) */
  onHostedCheckout: () => void;
}

const EMPTY: FieldState = { complete: false, invalid: false, error: null, failed: false };
const isPhone = (v: string) => /^[6-9]\d{9}$/.test(v);

export default function PaymentStep(p: Props) {
  const { quote, selected, onSelect, sdk, sdkStatus, busy, onPay } = p;
  const online = quote?.methods.online;
  const cod = quote?.methods.cod;
  const onlineOk = !!online?.enabled;
  const codOk = !!cod?.enabled;
  const pct = quote?.onlineDiscountPercent ?? 0;
  const onlineAmount = online ? rupees(online.total) : "—";

  // ── State of each payment method's Cashfree components ──
  const [cardNumber, setCardNumber] = useState<CfComponent | null>(null);
  const [cardStates, setCardStates] = useState<Record<string, FieldState>>({});
  const [upiCollect, setUpiCollect] = useState<CfComponent | null>(null);
  const [upiCollectState, setUpiCollectState] = useState<FieldState>(EMPTY);
  const [upiApp, setUpiApp] = useState<CfComponent | null>(null);
  const [upiPick, setUpiPick] = useState<"collect" | "app">("collect");
  const [upiAppName, setUpiAppName] = useState<string | null>(null);
  const [bank, setBank] = useState<CfComponent | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [walletComp, setWalletComp] = useState<CfComponent | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  const setCard = (k: string) => (s: FieldState) => setCardStates((prev) => (prev[k]?.complete === s.complete && prev[k]?.invalid === s.invalid && prev[k]?.error === s.error && prev[k]?.failed === s.failed ? prev : { ...prev, [k]: s }));
  const cardReady = ["number", "holder", "expiry", "cvv"].every((k) => cardStates[k]?.complete);
  // Degrade per method: a failing UPI-ID box must not take cards down with it.
  const cardFailed = Object.values(cardStates).some((s) => s.failed);
  const upiFailed = upiCollectState.failed;

  // Cashfree SDK could not be loaded at all (blocked / offline): everything uses Cashfree's hosted checkout.
  const hostedOnly = sdkStatus === "failed";

  const selection: Selection = useMemo(() => {
    if (selected === "cod") return { component: null, ready: true, hosted: false };
    if (hostedOnly) return { component: null, ready: true, hosted: true };
    switch (selected) {
      case "card":
        if (cardFailed) return { component: null, ready: true, hosted: true };
        return { component: cardNumber, ready: !!cardNumber && cardReady, hosted: false };
      case "upi": {
        if (upiPick === "app" && upiApp) return { component: upiApp, ready: true, hosted: false };
        if (upiFailed) return { component: null, ready: true, hosted: true };
        return { component: upiCollect, ready: !!upiCollect && upiCollectState.complete, hosted: false };
      }
      case "netbanking": return { component: bank, ready: !!bank, hosted: false };
      case "wallet": return { component: walletComp, ready: !!walletComp && isPhone(phone), hosted: false };
    }
  }, [selected, hostedOnly, cardFailed, upiFailed, cardNumber, cardReady, upiPick, upiApp, upiCollect, upiCollectState.complete, bank, walletComp, phone]);

  useEffect(() => { p.onSelection(selection); }, [selection]); // eslint-disable-line react-hooks/exhaustive-deps

  const payAmount = selected === "cod" ? cod?.total : online?.total;
  const payLabel = selected === "cod" ? `Place order · ${payAmount != null ? rupees(payAmount) : ""}` : `Pay ${payAmount != null ? rupees(payAmount) : ""} securely`;
  const chip = pct > 0 ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <Check size={11} /> Extra {pct}% off
    </span>
  ) : null;
  const box = (id: PaymentChoice, disabled: boolean) =>
    `overflow-hidden rounded-2xl border-2 ${selected === id ? "border-forest" : "border-ink/10"} ${disabled ? "opacity-50" : ""}`;
  const loading = sdkStatus === "loading" && !hostedOnly;
  const sdkForPanels = hostedOnly ? null : sdk;

  return (
    <section aria-label="Payment options" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Payment options</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
          <ShieldCheck size={14} className="text-leaf" /> Secured by Cashfree
        </span>
      </div>

      {!onlineOk && quote && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Online payments are temporarily unavailable. You can still pay on delivery.</p>
      )}
      {hostedOnly && onlineOk && (
        <p className="rounded-xl bg-ink/5 p-3 text-xs text-ink/60">
          You&apos;ll complete the payment in Cashfree&apos;s secure window.
        </p>
      )}

      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        {/* ── UPI ── */}
        <div className={box("upi", !onlineOk)}>
          {onlineOk && <p className="bg-forest px-4 py-1.5 text-center text-xs font-semibold text-white">Suggested payment method</p>}
          <MethodRow id="upi" selected={selected === "upi"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Smartphone size={20} />} title="Pay via UPI" subtitle="Google Pay, PhonePe, Paytm, BHIM & any UPI app" amount={onlineAmount} chip={chip}>
            {hostedOnly ? (
              <p className="text-xs text-ink/60">Tap Pay to choose your UPI app or scan a QR code.</p>
            ) : (
              <div className="space-y-4">
                {isMobile && (
                  <div>
                    <p className="mb-2 text-xs text-ink/50">Pay with an app</p>
                    <div className="grid grid-cols-3 gap-2">
                      {UPI_APPS.map((a) => (
                        <CfButton key={a.upiApp} sdk={sdkForPanels} type="upiApp" selected={upiPick === "app" && upiApp !== null && a.upiApp === upiAppName}
                          values={{ upiApp: a.upiApp, buttonText: a.label, buttonIcon: true }}
                          onPick={(c) => { setUpiApp(c); setUpiPick("app"); setUpiAppName(a.upiApp); }} />
                      ))}
                    </div>
                  </div>
                )}
                {upiFailed ? (
                  <p className="text-xs text-ink/60">Tap Pay to choose your UPI app or scan a QR code in Cashfree&apos;s secure window.</p>
                ) : (
                  <div onFocusCapture={() => setUpiPick("collect")}>
                    <CfField sdk={sdkForPanels} type="upiCollect" label="Or enter your UPI ID" values={{ placeholder: "yourname@bank" }}
                      onComponent={setUpiCollect} onState={setUpiCollectState} />
                  </div>
                )}
                <button type="button" onClick={p.onHostedCheckout} className="text-xs font-medium text-forest underline">
                  More UPI options / scan QR code
                </button>
                {loading && <p className="text-xs text-ink/40">Loading secure fields…</p>}
              </div>
            )}
          </MethodRow>
        </div>

        {/* ── Netbanking ── */}
        <div className={box("netbanking", !onlineOk)}>
          <MethodRow id="netbanking" selected={selected === "netbanking"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Landmark size={20} />} title="Netbanking" subtitle="Pay from your bank account" amount={onlineAmount} chip={chip}>
            {hostedOnly ? (
              <p className="text-xs text-ink/60">Tap Pay to choose your bank.</p>
            ) : (
              <>
                <p className="mb-2 text-xs text-ink/50">Popular banks</p>
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_BANKS.map((b) => (
                    <CfButton key={b.name} sdk={sdkForPanels} type="netbanking" selected={bankName === b.name}
                      values={{ netbankingBankName: b.name, buttonText: b.label, buttonIcon: true }}
                      onPick={(c) => { setBank(c); setBankName(b.name); }} />
                  ))}
                </div>
                <button type="button" onClick={p.onHostedCheckout} className="mt-3 text-xs font-medium text-forest underline">
                  Other banks
                </button>
                {loading && <p className="mt-2 text-xs text-ink/40">Loading secure fields…</p>}
              </>
            )}
          </MethodRow>
        </div>

        {/* ── Cards ── */}
        <div className={box("card", !onlineOk)}>
          <MethodRow id="card" selected={selected === "card"} disabled={!onlineOk} onSelect={onSelect}
            icon={<CreditCard size={20} />} title="Debit / Credit cards" subtitle="Visa, Mastercard, RuPay, Amex & more" amount={onlineAmount} chip={chip}>
            {hostedOnly || cardFailed ? (
              <p className="flex items-start gap-2 text-xs text-ink/60">
                <Lock size={13} className="mt-0.5 shrink-0 text-leaf" /> You&apos;ll enter your card details in Cashfree&apos;s secure window.
              </p>
            ) : (
              <div className="space-y-3">
                <CfField sdk={sdkForPanels} type="cardNumber" label="Card number" values={{ placeholder: "1234 5678 9012 3456" }}
                  onComponent={setCardNumber} onState={setCard("number")} />
                <CfField sdk={sdkForPanels} type="cardHolder" label="Name on card" values={{ placeholder: "As printed on the card" }} onState={setCard("holder")} />
                <div className="grid grid-cols-2 gap-3">
                  <CfField sdk={sdkForPanels} type="cardExpiry" label="Expiry" onState={setCard("expiry")} />
                  <CfField sdk={sdkForPanels} type="cardCvv" label="CVV" onState={setCard("cvv")} />
                </div>
                <p className="flex items-start gap-2 text-xs text-ink/50">
                  <Lock size={13} className="mt-0.5 shrink-0 text-leaf" />
                  These fields are hosted by Cashfree — your card details never touch our servers.
                </p>
                {loading && <p className="text-xs text-ink/40">Loading secure fields…</p>}
              </div>
            )}
          </MethodRow>
        </div>

        {/* ── Wallets ── */}
        <div className={box("wallet", !onlineOk)}>
          <MethodRow id="wallet" selected={selected === "wallet"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Wallet size={20} />} title="Wallets" subtitle="Pay with your mobile wallet" amount={onlineAmount} chip={chip}>
            {hostedOnly ? (
              <p className="text-xs text-ink/60">Tap Pay to choose your wallet.</p>
            ) : (
              <>
                <label htmlFor="wallet-phone" className="mb-1 block text-xs text-ink/50">Mobile number linked to your wallet</label>
                <input id="wallet-phone" value={phone} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number"
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setWalletComp(null); setWalletName(null); }}
                  className="mb-3 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-leaf" />
                {isPhone(phone) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {WALLETS.map((w) => (
                      <CfButton key={`${w.provider}-${phone}`} sdk={sdkForPanels} type="wallet" selected={walletName === w.provider}
                        values={{ provider: w.provider, phone, buttonText: w.label, buttonIcon: true }}
                        onPick={(c) => { setWalletComp(c); setWalletName(w.provider); }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink/40">Enter your number to see wallets.</p>
                )}
              </>
            )}
          </MethodRow>
        </div>

        {/* ── COD ── */}
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

      <button type="button" onClick={onPay}
        disabled={busy || !quote || !selection.ready || (selected === "cod" ? !codOk : !onlineOk)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
        {busy ? <><Loader2 size={18} className="animate-spin" /> Processing…</> : <>{selected !== "cod" && <Lock size={16} />}{payLabel}</>}
      </button>
      <p className="text-center text-xs text-ink/40">By continuing you agree to our terms and conditions. Payments are processed by Cashfree.</p>
    </section>
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
