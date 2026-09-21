"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MapPin, Plus, Check, ChevronRight, Truck, Banknote,
  AlertCircle, ArrowLeft, Loader2, ShieldCheck,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image.utils";
import { getAxiosErrorMessage } from "@/lib/errorUtils";
import { useQuote, rupees } from "@/hooks/useQuote";
import { loadCashfree, returnUrlFor, type CashfreeSDK } from "@/lib/cashfree";
import PaymentStep, { type PaymentChoice, type PayRequest } from "@/components/checkout/PaymentStep";
import type { QrState } from "@/components/checkout/QrCard";
import { startInlinePayment, fetchPayStatus } from "@/lib/payMethods";

type Step = "address" | "payment";
type Phase = "idle" | "creating" | "paying" | "confirming";

interface Address {
  id:       string;
  type:     string;
  fullName: string;
  phone:    string;
  line1:    string;
  line2:    string | null;
  city:     string;
  state:    string;
  pincode:  string;
  landmark: string | null;
  isDefault:boolean;
}

interface AddressForm {
  type:     string;
  fullName: string;
  phone:    string;
  line1:    string;
  line2:    string;
  city:     string;
  state:    string;
  pincode:  string;
  landmark: string;
}

const emptyForm: AddressForm = {
  type:     "HOME",
  fullName: "",
  phone:    "",
  line1:    "",
  line2:    "",
  city:     "",
  state:    "",
  pincode:  "",
  landmark: "",
};

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu",
  "Delhi","Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry",
];

// ── Page ─────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const { items, subtotal, clearCart } = useCartStore();

  const [step,            setStep]          = useState<Step>("address");
  const [selectedAddr,    setSelectedAddr]  = useState<string | null>(null);
  const [showNewForm,     setShowNewForm]   = useState(false);
  const [form,            setForm]          = useState<AddressForm>(emptyForm);
  const [formError,       setFormError]     = useState<string | null>(null);
  const [orderError,      setOrderError]    = useState<string | null>(null);
  const [submitting,      setSubmitting]    = useState(false);
  const [submitted,       setSubmitted]     = useState(false); // prevent double-submit

  const [choice,  setChoice]  = useState<PaymentChoice>("upi");
  const [sdk,       setSdk]       = useState<CashfreeSDK | null>(null);
  const [sdkStatus, setSdkStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [request,   setRequest]   = useState<PayRequest | null>(null);
  const [qr,        setQr]        = useState<QrState>({ status: "idle" });
  // A payment that is in progress outside this page (QR scanned / UPI request sent / UPI app opened).
  const [waiting,   setWaiting]   = useState<null | { orderNumber: string; kind: "qr" | "collect" | "intent"; label?: string }>(null);
  const [phase,   setPhase]   = useState<Phase>("idle");
  const [notice,  setNotice]  = useState<string | null>(null);

  // Every rupee shown here comes from the server quote — nothing is hard-coded.
  const { data: quote } = useQuote(items);
  const isCod   = choice === "cod";
  const totals  = quote ? (isCod ? quote.methods.cod : quote.methods.online) : undefined;
  const sub     = subtotal();
  const unavailable = quote?.lines.filter((l) => !l.available) ?? [];

  // Load Cashfree's SDK (from its CDN) in the mode the server told us to use. If it can't load
  // (blocked / offline / domain not enabled) the payment step falls back to Cashfree's hosted checkout.
  const sdkTried = useRef(false);
  useEffect(() => {
    const mode = quote?.gateway?.mode;
    if (!mode || !quote?.methods.online.enabled || sdkTried.current) return;
    sdkTried.current = true;
    loadCashfree(mode).then((s) => { setSdk(s); setSdkStatus(s ? "ready" : "failed"); }).catch(() => setSdkStatus("failed"));
  }, [quote]);

  // Returning from a failed 3-D Secure / bank redirect: show why, keep the cart.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pay") === "failed") {
      setNotice(`${(params.get("reason") ?? "The payment was not completed").replace(/[.!]?$/, ".")} No money was deducted — you can try again.`);
      setStep("payment"); // straight back to the payment options, address is pre-selected
      router.replace("/checkout");
    }
  }, [router]);

  // If online payments are switched off, fall back to COD.
  useEffect(() => {
    if (quote && !quote.methods.online.enabled && quote.methods.cod.enabled) setChoice("cod");
  }, [quote]);

  // Redirect unauthenticated
  useEffect(() => {
    if (isHydrated && !user) router.replace("/");
  }, [isHydrated, user, router]);

  // Redirect empty cart — but not right after a successful order, when we clear the
  // cart ourselves and are already heading to the confirmation page.
  const orderDone = useRef(false);
  useEffect(() => {
    if (isHydrated && items.length === 0 && !orderDone.current) router.replace("/cart");
  }, [isHydrated, items, router]);

  // Fetch saved addresses
  const { data: addrData, refetch: refetchAddresses } = useQuery<Address[]>({
    queryKey: ["addresses"],
    queryFn:  () => api.get("/addresses").then((r) => r.data.data),
    enabled:  !!user,
    staleTime: 0,
  });
  const addresses = addrData ?? [];

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddr) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddr(def.id);
    }
  }, [addresses, selectedAddr]);

  // Returning customers with a saved address go straight to payment; only customers with no saved
  // address see the address form. ("Change" still takes you back to it.)
  const autoAdvanced = useRef(false);
  useEffect(() => {
    if (autoAdvanced.current || addrData === undefined) return;
    autoAdvanced.current = true;
    if (addrData.length > 0) {
      const def = addrData.find((a) => a.isDefault) ?? addrData[0];
      setSelectedAddr((cur) => cur ?? def.id);
      setStep("payment");
    }
  }, [addrData]);

  // Save new address mutation
  const saveAddress = useMutation({
    mutationFn: (data: AddressForm) => api.post("/addresses", data).then((r) => r.data.data),
    onSuccess:  async (addr: Address) => {
      await refetchAddresses();
      setSelectedAddr(addr.id);
      setShowNewForm(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (err) => setFormError(getAxiosErrorMessage(err)),
  });

  function validateForm() {
    if (!form.fullName.trim() || form.fullName.trim().length < 2) return "Full name is required.";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, ""))) return "Enter a valid 10-digit mobile number.";
    if (!form.line1.trim() || form.line1.trim().length < 3) return "Address line 1 is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state) return "State is required.";
    if (!/^\d{6}$/.test(form.pincode)) return "Enter a valid 6-digit pincode.";
    return null;
  }

  function handleSaveAddress() {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    setFormError(null);
    saveAddress.mutate(form);
  }

  /** Push the local cart to the server cart so the backend prices exactly what the customer sees. */
  async function syncCartToServer() {
    await api.delete("/cart");
    for (const item of items) {
      await api.post("/cart/items", { variantId: item.variantId, quantity: item.quantity });
    }
  }

  function selectedAddress() {
    const addr = addresses.find((a) => a.id === selectedAddr);
    if (!addr) return null;
    return {
      fullName: addr.fullName, phone: addr.phone, line1: addr.line1, line2: addr.line2 ?? undefined,
      city: addr.city, state: addr.state, pincode: addr.pincode, landmark: addr.landmark ?? undefined,
    };
  }

  /** Shared checks before any payment starts. Returns the shipping body, or null after showing the reason. */
  function preflight() {
    setOrderError(null);
    setNotice(null);
    const shippingBody = selectedAddress();
    if (!selectedAddr || !shippingBody) { setOrderError("Please select a delivery address."); return null; }
    if (unavailable.length > 0) { setOrderError("Some items in your cart are no longer available. Please review your cart."); return null; }
    return shippingBody;
  }

  /** Create (or re-use) our order and the matching Cashfree order for the current cart. */
  async function prepareOrder(shippingBody: NonNullable<ReturnType<typeof selectedAddress>>) {
    await syncCartToServer();
    const { data } = await api.post("/orders/create-payment-order", shippingBody);
    return data.data as { orderId: string; orderNumber: string; paymentSessionId: string };
  }

  function stopWaiting() {
    setWaiting(null);
    setQr((q) => (q.status === "shown" ? { status: "idle" } : q));
  }

  // While the customer pays in a UPI app / scans the QR, ask OUR server (which asks Cashfree) every 3 s.
  useEffect(() => {
    if (!waiting) return;
    let cancelled = false;
    let tries = 0;
    const timer = setInterval(async () => {
      if (cancelled) return;
      tries++;
      try {
        const st = await fetchPayStatus(waiting.orderNumber);
        if (cancelled) return;
        if (st.status === "PAID") {
          cancelled = true;
          clearInterval(timer);
          orderDone.current = true;
          clearCart();
          router.replace(`/order-confirmation/${st.orderId}?paid=1`);
          return;
        }
        if (st.status === "FAILED" || st.status === "EXPIRED") {
          cancelled = true;
          clearInterval(timer);
          setWaiting(null);
          setQr({ status: "idle" });
          setNotice(st.status === "FAILED"
            ? `${st.reason.replace(/[.!]?$/, ".")} You can retry or choose another method.`
            : "The payment window expired. Please try again.");
          return;
        }
      } catch { /* network hiccup: keep polling */ }
      if (tries >= 200) { cancelled = true; clearInterval(timer); stopWaiting(); }
    }, 3000);
    return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waiting]);

  /** "Click to show QR": create the order, ask Cashfree for a QR, show it inline and wait for the payment. */
  async function showQr() {
    if (phase !== "idle") return;
    const shippingBody = preflight();
    if (!shippingBody) return;
    setQr({ status: "loading" });
    try {
      const o = await prepareOrder(shippingBody);
      const r = await startInlinePayment(o.orderNumber, { method: "upi_qr" });
      if (r.kind !== "qr") throw new Error("Unexpected response");
      setQr({ status: "shown", image: r.qrImage, expiresAt: Date.now() + r.expiresInSeconds * 1000 });
      setWaiting({ orderNumber: o.orderNumber, kind: "qr" });
    } catch (err) {
      setQr({ status: "error", error: getAxiosErrorMessage(err) });
    }
  }

  function qrExpired() {
    setQr((q) => (q.status === "shown" ? { status: "expired" } : q));
    setWaiting((w) => (w?.kind === "qr" ? null : w));
  }

  /** Cashfree's own checkout for this order (any bank, any UPI app) — also the fallback when hosted fields can't load. */
  function handleHostedCheckout() {
    return runRequest({ kind: "hosted" });
  }

  function handlePay() {
    if (request) return runRequest(request);
  }

  async function runRequest(req: PayRequest) {
    if (phase !== "idle") return;
    const shippingBody = preflight();
    if (!shippingBody) return;

    setPhase("creating");
    setQr((q) => (q.status === "shown" ? { status: "idle" } : q)); // choosing another way to pay hides an open QR
    try {
      // ── Cash on delivery ────────────────────────────────────
      if (req.kind === "cod") {
        await syncCartToServer();
        const { data } = await api.post("/orders/create-cod-order", shippingBody);
        orderDone.current = true;
        clearCart();
        router.push(`/order-confirmation/${data.data.id}`);
        return;
      }

      // ── Online ──────────────────────────────────────────────
      const o = await prepareOrder(shippingBody);

      switch (req.kind) {
        case "upi_collect": {
          await startInlinePayment(o.orderNumber, { method: "upi_collect", upiId: req.upiId });
          setWaiting({ orderNumber: o.orderNumber, kind: "collect", label: req.upiId });
          setPhase("idle");
          return;
        }
        case "upi_intent": {
          const r = await startInlinePayment(o.orderNumber, { method: "upi_intent" });
          if (r.kind !== "intent") throw new Error("Unexpected response");
          const link = r.links[req.app as keyof typeof r.links] ?? r.links.default;
          if (!link) throw new Error("That UPI app isn't available right now. Please try another way to pay.");
          setWaiting({ orderNumber: o.orderNumber, kind: "intent" });
          setPhase("idle");
          window.location.href = link; // opens the UPI app; we keep polling for the result
          return;
        }
        case "netbanking":
        case "wallet": {
          const r = await startInlinePayment(
            o.orderNumber,
            req.kind === "netbanking" ? { method: "netbanking", bankCode: req.bankCode } : { method: "wallet", provider: req.provider, phone: req.phone },
          );
          if (r.kind !== "redirect") throw new Error("Unexpected response");
          setPhase("paying");
          window.location.assign(r.url); // bank / wallet page; Cashfree returns the customer to /payment/return
          return;
        }
        case "card":
        case "hosted": {
          if (!sdk) throw new Error("The secure payment window could not be loaded. Please check your connection and try again.");
          const returnUrl = returnUrlFor(o.orderNumber);
          setPhase("paying");
          const result = req.kind === "card"
            ? await sdk.pay({ paymentMethod: req.component, paymentSessionId: o.paymentSessionId, returnUrl, redirect: "if_required" })
            : await sdk.checkout({ paymentSessionId: o.paymentSessionId, returnUrl, redirectTarget: "_modal" });
          if (result.error) {
            setPhase("idle");
            setNotice(`${(result.error.message ?? "The payment could not be completed").replace(/[.!]?$/, ".")} You can retry or choose another method.`);
          } else if (result.redirect) {
            // The browser is being sent to the bank (3-D Secure); Cashfree brings it back to /payment/return.
          } else {
            // Finished without a redirect (e.g. the window was closed): ask our server what happened.
            orderDone.current = true;
            router.push(`/payment/return?order_id=${encodeURIComponent(o.orderNumber)}`);
          }
          return;
        }
      }
    } catch (err) {
      setPhase("idle");
      setOrderError(getAxiosErrorMessage(err));
    }
  }

  if (!isHydrated || !user) return null;

  // ── Render ────────────────────────────────────────────────────

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Back */}
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-6">
        <ArrowLeft size={15} /> Back to cart
      </Link>

      <h1 className="font-display text-3xl text-ink mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        <StepBadge active={step === "address"} done={step === "payment"} n={1} label="Address" />
        <ChevronRight size={14} className="text-ink/30" />
        <StepBadge active={step === "payment"} done={false} n={2} label="Payment" />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">

        {/* ── Left panel ─────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Step 1: Address */}
          {step === "address" && (
            <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6">
              <h2 className="font-semibold text-ink flex items-center gap-2 mb-5">
                <MapPin size={16} className="text-leaf" /> Delivery Address
              </h2>

              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="space-y-3 mb-5">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedAddr === addr.id
                          ? "border-leaf bg-leaf/5"
                          : "border-ink/10 hover:border-ink/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddr === addr.id}
                        onChange={() => { setSelectedAddr(addr.id); setShowNewForm(false); }}
                        className="mt-0.5 accent-leaf"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-ink">{addr.fullName}</span>
                          <span className="text-xs bg-ink/8 text-ink/60 px-2 py-0.5 rounded-full">{addr.type}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-leaf/10 text-leaf px-2 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-ink/60 mt-0.5">
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? `, ${addr.landmark}` : ""}
                        </p>
                        <p className="text-sm text-ink/60">
                          {addr.city}, {addr.state} — {addr.pincode}
                        </p>
                        <p className="text-xs text-ink/40 mt-0.5">📞 {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Add new address toggle */}
              {!showNewForm && (
                <button
                  onClick={() => {
                    const mobile = user?.mobile ?? "";
                    const phone  = mobile.startsWith("+91") ? mobile.slice(3) : mobile;
                    setForm({ ...emptyForm, fullName: user?.name ?? "", phone });
                    setShowNewForm(true);
                    setSelectedAddr(null);
                  }}
                  className="flex items-center gap-2 text-sm text-leaf font-medium hover:underline"
                >
                  <Plus size={14} /> Add new address
                </button>
              )}

              {/* New address form */}
              {showNewForm && (
                <div className="border border-ink/10 rounded-xl p-5 mt-4">
                  <h3 className="font-medium text-sm text-ink mb-4">New Address</h3>

                  {formError && (
                    <div className="mb-3 flex gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" /> {formError}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormInput label="Full Name *" value={form.fullName} onChange={(v) => setForm((f) => ({ ...f, fullName: v }))} placeholder="Recipient's full name" col2 />
                    <FormInput label="Mobile *" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} placeholder="10-digit mobile" col2 />
                    <FormInput label="Address Line 1 *" value={form.line1} onChange={(v) => setForm((f) => ({ ...f, line1: v }))} placeholder="House/flat/block no., street" col2 />
                    <FormInput label="Address Line 2" value={form.line2} onChange={(v) => setForm((f) => ({ ...f, line2: v }))} placeholder="Colony / locality (optional)" col2 />
                    <FormInput label="Landmark" value={form.landmark} onChange={(v) => setForm((f) => ({ ...f, landmark: v }))} placeholder="Near / opposite (optional)" col2 />
                    <FormInput label="City *" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} placeholder="City" />
                    <div>
                      <label className="block text-xs text-ink/50 mb-1">State *</label>
                      <select
                        value={form.state}
                        onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                        className="w-full rounded-lg border border-ink/15 focus:border-leaf px-3 py-2.5 text-sm outline-none transition-colors bg-white"
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <FormInput label="Pincode *" value={form.pincode} onChange={(v) => setForm((f) => ({ ...f, pincode: v }))} placeholder="6-digit pincode" maxLength={6} />
                    <div>
                      <label className="block text-xs text-ink/50 mb-1">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                        className="w-full rounded-lg border border-ink/15 focus:border-leaf px-3 py-2.5 text-sm outline-none transition-colors bg-white"
                      >
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleSaveAddress}
                      disabled={saveAddress.isPending}
                      className="rounded-lg bg-leaf text-white text-sm font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50"
                    >
                      {saveAddress.isPending ? "Saving…" : "Save Address"}
                    </button>
                    <button
                      onClick={() => { setShowNewForm(false); setFormError(null); setForm(emptyForm); }}
                      className="rounded-lg border border-ink/10 text-ink text-sm px-5 py-2.5 hover:bg-ink/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Continue */}
              {!showNewForm && (
                <button
                  onClick={() => {
                    if (!selectedAddr) { setOrderError("Please select or add a delivery address."); return; }
                    setOrderError(null);
                    setStep("payment");
                  }}
                  disabled={!selectedAddr && addresses.length > 0}
                  className="mt-6 w-full rounded-xl bg-leaf text-white font-medium py-3.5 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Continue
                </button>
              )}
              {orderError && (
                <p className="mt-3 text-sm text-red-500 flex items-center gap-2">
                  <AlertCircle size={14} /> {orderError}
                </p>
              )}
            </div>
          )}

          {/* Step 2: Payment + confirmation */}
          {step === "payment" && (
            <>
              {/* Selected address summary */}
              {(() => {
                const addr = addresses.find((a) => a.id === selectedAddr);
                return addr ? (
                  <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
                        <MapPin size={14} className="text-leaf" /> Delivering to
                      </h3>
                      <button onClick={() => setStep("address")} className="text-xs text-leaf hover:underline">Change</button>
                    </div>
                    <p className="text-sm font-medium text-ink">{addr.fullName}</p>
                    <p className="text-sm text-ink/60">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}{addr.landmark ? `, ${addr.landmark}` : ""}
                    </p>
                    <p className="text-sm text-ink/60">{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="text-xs text-ink/40 mt-0.5">📞 {addr.phone}</p>
                  </div>
                ) : null;
              })()}

              {/* Shipping info */}
              <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
                <h3 className="font-semibold text-sm text-ink flex items-center gap-2 mb-3">
                  <Truck size={14} className="text-leaf" /> Delivery
                </h3>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  <span className="text-sm text-ink/70">
                    {!totals
                      ? "Standard delivery (1–3 business days)"
                      : totals.shippingFee === 0
                      ? "Free standard delivery (1–3 business days)"
                      : `Standard delivery — ${rupees(totals.shippingFee)} (1–3 business days)`}
                  </span>
                </div>
              </div>

              {unavailable.length > 0 && (
                <div className="flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>Some items in your cart are unavailable or low on stock. <Link href="/cart" className="underline">Review your cart</Link>.</span>
                </div>
              )}
              {notice && (
                <div role="status" className="flex gap-2 rounded-xl bg-ink/5 p-4 text-sm text-ink/70">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {notice}
                </div>
              )}
              {orderError && (
                <div role="alert" className="flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {orderError}
                </div>
              )}
              {waiting && waiting.kind !== "qr" && (
                <div role="status" className="flex items-start gap-3 rounded-xl border border-forest/30 bg-leaf/5 p-4 text-sm">
                  <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-forest" />
                  <div className="flex-1">
                    <p className="font-medium text-ink">
                      {waiting.kind === "collect" ? `Payment request sent to ${waiting.label}` : "Complete the payment in your UPI app"}
                    </p>
                    <p className="mt-0.5 text-xs text-ink/60">
                      {waiting.kind === "collect" ? "Open your UPI app and approve it." : "Come back to this page after paying."} This page updates automatically.
                    </p>
                  </div>
                  <button type="button" onClick={stopWaiting} className="text-xs font-medium text-forest underline">Cancel</button>
                </div>
              )}
              <PaymentStep
                quote={quote} selected={choice} onSelect={(c) => { setChoice(c); setNotice(null); setOrderError(null); }}
                sdk={sdk} sdkStatus={sdkStatus} onRequest={setRequest}
                busy={phase !== "idle" || (!!waiting && waiting.kind !== "qr")} onPay={handlePay}
                qr={qr} onShowQr={showQr} onQrExpired={qrExpired}
                onHostedCheckout={handleHostedCheckout}
              />
            </>
          )}
        </div>

        {/* ── Order summary sidebar ──────────────────────────── */}
        <aside>
          <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-6 sticky top-24">
            <h2 className="font-semibold text-ink mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3">
                  <div className="h-14 w-14 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink line-clamp-2">{item.title}</p>
                    <p className="text-xs text-ink/40">{item.variantTitle}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-ink/50">Qty {item.quantity}</span>
                      <span className="text-xs font-medium text-ink">₹{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink/8 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span><span>{rupees(totals?.subtotal ?? sub)}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                <span>{!totals ? "—" : totals.shippingFee === 0 ? <span className="text-green-600">Free</span> : rupees(totals.shippingFee)}</span>
              </div>
              {isCod && totals && totals.codFee > 0 && (
                <div className="flex justify-between text-ink/60">
                  <span>COD charge</span><span>{rupees(totals.codFee)}</span>
                </div>
              )}
              {!isCod && totals && totals.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Online payment discount</span><span>−{rupees(totals.discount)}</span>
                </div>
              )}
              <div className="border-t border-ink/8 pt-2 flex justify-between font-semibold text-ink">
                <span>Total payable</span><span>{totals ? rupees(totals.total) : "—"}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/40 text-center">
              Inclusive of all taxes · Free returns within 7 days
            </p>
          </div>
        </aside>
      </div>
      {phase === "confirming" && (
        <div role="alertdialog" aria-live="assertive" className="fixed inset-0 z-[70] flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="max-w-sm px-6 text-center">
            <Loader2 size={36} className="mx-auto mb-4 animate-spin text-forest" />
            <p className="font-display text-xl text-ink">Confirming your payment…</p>
            <p className="mt-2 text-sm text-ink/60">Please don&apos;t close or refresh this page.</p>
          </div>
        </div>
      )}
    </main>
  );
}

// ── Mini components ───────────────────────────────────────────────

function StepBadge({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-leaf" : done ? "text-leaf/60" : "text-ink/30"}`}>
      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
        active ? "bg-leaf text-white" : done ? "bg-leaf/20 text-leaf" : "bg-ink/10 text-ink/30"
      }`}>
        {done ? <Check size={12} /> : n}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function FormInput({
  label, value, onChange, placeholder, col2, maxLength, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; col2?: boolean; maxLength?: number; type?: string;
}) {
  return (
    <div className={col2 ? "sm:col-span-2" : ""}>
      <label className="block text-xs text-ink/50 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full rounded-lg border border-ink/15 focus:border-leaf px-3 py-2.5 text-sm outline-none transition-colors"
      />
    </div>
  );
}
