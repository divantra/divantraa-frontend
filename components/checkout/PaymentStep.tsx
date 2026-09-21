"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Banknote, Check, ChevronRight, CreditCard, Landmark, Loader2, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { rupees, type Quote } from "@/hooks/useQuote";
import { CfField, type FieldState } from "@/components/checkout/CfParts";
import { LogoRow, PayLogo } from "@/components/checkout/PayLogo";
import QrCard, { type QrState } from "@/components/checkout/QrCard";
import type { CashfreeSDK, CfComponent } from "@/lib/cashfree";
import { BANKS, TEST_BANK, UPI_APPS, WALLETS, isValidMobile, isValidVpa } from "@/lib/payMethods";

export type PaymentChoice = "upi" | "card" | "netbanking" | "wallet" | "cod";

/** What "Pay" will do for the current selection (null = the selection is not complete yet). */
export type PayRequest =
  | { kind: "cod" }
  | { kind: "hosted" }                                            // Cashfree's own checkout window
  | { kind: "card"; component: CfComponent }                      // Cashfree-hosted card fields
  | { kind: "upi_collect"; upiId: string }
  | { kind: "upi_intent"; app: string }
  | { kind: "netbanking"; bankCode: number }
  | { kind: "wallet"; provider: string; phone: string };

interface Props {
  quote: Quote | undefined;
  selected: PaymentChoice;
  onSelect: (c: PaymentChoice) => void;
  sdk: CashfreeSDK | null;
  sdkStatus: "loading" | "ready" | "failed";
  onRequest: (r: PayRequest | null) => void;
  busy: boolean;
  onPay: () => void;
  qr: QrState;
  onShowQr: () => void;
  onQrExpired: () => void;
  /** Open Cashfree's own checkout (any bank / any app) */
  onHostedCheckout: () => void;
}

export default function PaymentStep(p: Props) {
  const { quote, selected, onSelect, sdk, sdkStatus, busy, onPay } = p;
  const online = quote?.methods.online;
  const cod = quote?.methods.cod;
  const onlineOk = !!online?.enabled;
  const codOk = !!cod?.enabled;
  const pct = quote?.onlineDiscountPercent ?? 0;
  const onlineAmount = online ? rupees(online.total) : "—";
  const sandbox = quote?.gateway?.mode === "sandbox";

  // ── selections ──
  const [upiApp, setUpiApp] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [bankCode, setBankCode] = useState<number | null>(null);
  const [walletProvider, setWalletProvider] = useState<string | null>(null);
  const [walletPhone, setWalletPhone] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad/i.test(navigator.userAgent));
  }, []);

  // ── card fields (Cashfree-hosted iframes) ──
  const [cardNumber, setCardNumber] = useState<CfComponent | null>(null);
  const [cardStates, setCardStates] = useState<Record<string, FieldState>>({});
  const setCard = (k: string) => (s: FieldState) =>
    setCardStates((prev) => (prev[k]?.complete === s.complete && prev[k]?.invalid === s.invalid && prev[k]?.error === s.error && prev[k]?.failed === s.failed ? prev : { ...prev, [k]: s }));
  const cardReady = ["number", "holder", "expiry", "cvv"].every((k) => cardStates[k]?.complete);
  const cardFailed = Object.values(cardStates).some((s) => s.failed);
  const sdkDown = sdkStatus === "failed";
  const cardHosted = sdkDown || cardFailed; // card fields can't load (e.g. domain not whitelisted) -> Cashfree's window

  const upiIdInvalid = upiId.trim() !== "" && !isValidVpa(upiId);
  const phoneInvalid = walletPhone !== "" && !isValidMobile(walletPhone);

  const request: PayRequest | null = useMemo(() => {
    switch (selected) {
      case "cod": return { kind: "cod" };
      case "card":
        if (cardHosted) return { kind: "hosted" };
        return cardNumber && cardReady ? { kind: "card", component: cardNumber } : null;
      case "upi":
        if (upiApp) return { kind: "upi_intent", app: upiApp };
        return isValidVpa(upiId) ? { kind: "upi_collect", upiId: upiId.trim() } : null;
      case "netbanking": return bankCode ? { kind: "netbanking", bankCode } : null;
      case "wallet": return walletProvider && isValidMobile(walletPhone) ? { kind: "wallet", provider: walletProvider, phone: walletPhone } : null;
    }
  }, [selected, cardHosted, cardNumber, cardReady, upiApp, upiId, bankCode, walletProvider, walletPhone]);

  useEffect(() => { p.onRequest(request); }, [request]); // eslint-disable-line react-hooks/exhaustive-deps

  const payAmount = selected === "cod" ? cod?.total : online?.total;
  const payLabel = selected === "cod" ? `Place order · ${payAmount != null ? rupees(payAmount) : ""}` : `Pay ${payAmount != null ? rupees(payAmount) : ""} securely`;
  const chip = pct > 0 ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
      <Check size={11} /> Extra {pct}% off
    </span>
  ) : null;
  const box = (id: PaymentChoice, disabled: boolean) =>
    `overflow-hidden rounded-2xl border-2 ${selected === id ? "border-forest" : "border-ink/10"} ${disabled ? "opacity-50" : ""}`;
  const tile = (active: boolean) =>
    `flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${active ? "border-forest bg-leaf/5 text-forest" : "border-ink/15 text-ink/70 hover:border-ink/30"}`;
  const banks = sandbox ? [TEST_BANK, ...BANKS] : BANKS;

  return (
    <section aria-label="Payment options" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Payment methods</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink/50">
          <ShieldCheck size={14} className="text-leaf" /> Secured by Cashfree
        </span>
      </div>

      {!onlineOk && quote && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Online payments are temporarily unavailable. You can still pay on delivery.</p>
      )}

      {/* Pay via UPI apps — inline QR */}
      {onlineOk && <QrCard qr={p.qr} amount={onlineAmount} chip={chip} disabled={busy} onShow={p.onShowQr} onExpired={p.onQrExpired} />}

      <div role="radiogroup" aria-label="Payment method" className="space-y-3">
        {/* ── UPI (suggested) ── */}
        <div className={box("upi", !onlineOk)}>
          {onlineOk && <p className="bg-forest px-4 py-1.5 text-center text-xs font-semibold text-white">Suggested payment method</p>}
          <MethodRow id="upi" selected={selected === "upi"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Smartphone size={20} />} title="Pay via UPI" subtitle="Use any registered UPI ID" amount={onlineAmount} chip={chip}
            logos={[{ name: "phonepe", label: "PhonePe" }, { name: "gpay", label: "GPay" }, { name: "paytm", label: "Paytm" }]}>
            <div className="space-y-4">
              {isMobile && (
                <div>
                  <p className="mb-2 text-xs text-ink/50">Open your UPI app</p>
                  <div className="grid grid-cols-2 gap-2">
                    {UPI_APPS.map((a) => (
                      <button key={a.key} type="button" aria-pressed={upiApp === a.key} onClick={() => { setUpiApp(upiApp === a.key ? null : a.key); }} className={tile(upiApp === a.key)}>
                        <PayLogo name={a.key} label={a.label} className="h-5" /> <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="upi-id" className="mb-1 block text-xs text-ink/50">{isMobile ? "Or enter your UPI ID" : "Enter your UPI ID"}</label>
                <input id="upi-id" value={upiId} inputMode="email" autoComplete="off" placeholder="yourname@bank" aria-invalid={upiIdInvalid}
                  onChange={(e) => { setUpiId(e.target.value); if (e.target.value) setUpiApp(null); }}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${upiIdInvalid ? "border-red-400" : "border-ink/15 focus:border-leaf"}`} />
                {upiIdInvalid
                  ? <p className="mt-1 text-xs text-red-500">Enter a valid UPI ID like name@okhdfcbank.</p>
                  : <p className="mt-1 text-xs text-ink/40">We&apos;ll send a payment request to your UPI app — approve it there.</p>}
              </div>
              <button type="button" onClick={p.onHostedCheckout} className="text-xs font-medium text-forest underline">
                More options in Cashfree&apos;s secure window
              </button>
            </div>
          </MethodRow>
        </div>

        {/* ── Netbanking ── */}
        <div className={box("netbanking", !onlineOk)}>
          <MethodRow id="netbanking" selected={selected === "netbanking"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Landmark size={20} />} title="Netbanking" subtitle="Select from a list of banks" amount={onlineAmount} chip={chip}
            logos={[{ name: "hdfc", label: "HDFC" }, { name: "icici", label: "ICICI" }, { name: "sbi", label: "SBI" }]}>
            <p className="mb-2 text-xs text-ink/50">{sandbox ? "Popular banks (pick Test Bank to try a sandbox payment)" : "Popular banks"}</p>
            <div className="grid grid-cols-2 gap-2">
              {banks.map((b) => (
                <button key={b.code} type="button" aria-pressed={bankCode === b.code} onClick={() => setBankCode(b.code)} className={tile(bankCode === b.code)}>
                  {b.logo ? <PayLogo name={b.logo} label={b.label} className="h-5" /> : <Landmark size={16} className="shrink-0" />}
                  <span className="truncate">{b.label}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={p.onHostedCheckout} className="mt-3 text-xs font-medium text-forest underline">Other banks</button>
          </MethodRow>
        </div>

        {/* ── Cards ── */}
        <div className={box("card", !onlineOk)}>
          <MethodRow id="card" selected={selected === "card"} disabled={!onlineOk} onSelect={onSelect}
            icon={<CreditCard size={20} />} title="Debit / Credit cards" subtitle="Visa, Mastercard, RuPay & more" amount={onlineAmount} chip={chip}
            logos={[{ name: "visa", label: "Visa" }, { name: "mastercard", label: "Mastercard" }, { name: "rupay", label: "RuPay" }]}>
            {cardHosted ? (
              <p className="flex items-start gap-2 text-xs text-ink/60">
                <Lock size={13} className="mt-0.5 shrink-0 text-leaf" /> You&apos;ll enter your card details in Cashfree&apos;s secure window.
              </p>
            ) : (
              <div className="space-y-3">
                <CfField sdk={sdk} type="cardNumber" label="Card number" values={{ placeholder: "1234 5678 9012 3456" }} onComponent={setCardNumber} onState={setCard("number")} />
                <CfField sdk={sdk} type="cardHolder" label="Name on card" values={{ placeholder: "As printed on the card" }} onState={setCard("holder")} />
                <div className="grid grid-cols-2 gap-3">
                  <CfField sdk={sdk} type="cardExpiry" label="Expiry" onState={setCard("expiry")} />
                  <CfField sdk={sdk} type="cardCvv" label="CVV" onState={setCard("cvv")} />
                </div>
                <p className="flex items-start gap-2 text-xs text-ink/50">
                  <Lock size={13} className="mt-0.5 shrink-0 text-leaf" />
                  These fields are hosted by Cashfree — your card details never touch our servers.
                </p>
                {sdkStatus === "loading" && <p className="text-xs text-ink/40">Loading secure fields…</p>}
              </div>
            )}
          </MethodRow>
        </div>

        {/* ── Wallets ── */}
        <div className={box("wallet", !onlineOk)}>
          <MethodRow id="wallet" selected={selected === "wallet"} disabled={!onlineOk} onSelect={onSelect}
            icon={<Wallet size={20} />} title="Wallets" subtitle="Paytm, PhonePe, Amazon Pay & more" amount={onlineAmount} chip={chip}
            logos={[{ name: "paytm", label: "Paytm" }, { name: "phonepe", label: "PhonePe" }, { name: "amazon", label: "Amazon Pay" }]}>
            <label htmlFor="wallet-phone" className="mb-1 block text-xs text-ink/50">Mobile number linked to your wallet</label>
            <input id="wallet-phone" value={walletPhone} inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" aria-invalid={phoneInvalid}
              onChange={(e) => setWalletPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={`mb-3 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-leaf ${phoneInvalid ? "border-red-400" : "border-ink/15"}`} />
            <div className="grid grid-cols-2 gap-2">
              {WALLETS.map((w) => (
                <button key={w.provider} type="button" aria-pressed={walletProvider === w.provider} onClick={() => setWalletProvider(w.provider)} className={tile(walletProvider === w.provider)}>
                  <PayLogo name={w.provider} label={w.label} className="h-5" /> <span className="truncate">{w.label}</span>
                </button>
              ))}
            </div>
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
        disabled={busy || !quote || !request || (selected === "cod" ? !codOk : !onlineOk)}
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
  logos?: { name: string; label: string }[];
}) {
  const { id, selected, disabled, onSelect, icon, title, subtitle, amount, chip, children, logos } = props;
  return (
    <div className="bg-white">
      <button type="button" role="radio" aria-checked={selected} disabled={disabled} onClick={() => onSelect(id)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left disabled:cursor-not-allowed">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? "bg-forest text-white" : "bg-ink/5 text-ink/60"}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">{title}</span>
            {logos && <LogoRow items={logos} />}
          </span>
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
