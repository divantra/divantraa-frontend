"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  MapPin, Plus, Check, ChevronRight, Truck, Banknote,
  AlertCircle, Package, ArrowLeft,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image.utils";
import { getAxiosErrorMessage } from "@/lib/errorUtils";

// ── Constants ────────────────────────────────────────────────────
const SHIPPING_FREE_THRESHOLD = 999;
const SHIPPING_FEE            = 79;
const COD_FEE                 = 50;

type Step = "address" | "review";

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

  const sub      = subtotal();
  const shipping = sub >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FEE;
  const total    = sub + shipping + COD_FEE;

  // Redirect unauthenticated
  useEffect(() => {
    if (isHydrated && !user) router.replace("/");
  }, [isHydrated, user, router]);

  // Redirect empty cart
  useEffect(() => {
    if (isHydrated && items.length === 0) router.replace("/cart");
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

  async function handlePlaceOrder() {
    if (submitted || submitting) return;
    if (!selectedAddr) { setOrderError("Please select a delivery address."); return; }

    const addr = addresses.find((a) => a.id === selectedAddr);
    if (!addr) { setOrderError("Selected address not found."); return; }

    setSubmitting(true);
    setSubmitted(true);
    setOrderError(null);

    try {
      // Sync local cart to server before placing order.
      // DELETE first (so POST takes the create path, not increment), then re-add every item.
      // Errors are NOT suppressed — if sync fails the user sees a real error message.
      await api.delete("/cart");
      for (const item of items) {
        await api.post("/cart/items", { variantId: item.variantId, quantity: item.quantity });
      }

      const { data } = await api.post("/orders/create-cod-order", {
        fullName: addr.fullName,
        phone:    addr.phone,
        line1:    addr.line1,
        line2:    addr.line2 ?? undefined,
        city:     addr.city,
        state:    addr.state,
        pincode:  addr.pincode,
        landmark: addr.landmark ?? undefined,
      });

      clearCart();
      router.push(`/order-confirmation/${data.data.id}`);
    } catch (err) {
      setOrderError(getAxiosErrorMessage(err));
      setSubmitted(false);
    } finally {
      setSubmitting(false);
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
        <StepBadge active={step === "address"} done={step === "review"} n={1} label="Address" />
        <ChevronRight size={14} className="text-ink/30" />
        <StepBadge active={step === "review"} done={false} n={2} label="Review & Pay" />
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
                    setStep("review");
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
          {step === "review" && (
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
                    {shipping === 0
                      ? "Free standard delivery (1–3 business days)"
                      : `Standard delivery — ₹${SHIPPING_FEE} (1–3 business days)`}
                  </span>
                </div>
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-2xl border border-ink/8 shadow-sm p-5">
                <h3 className="font-semibold text-sm text-ink flex items-center gap-2 mb-3">
                  <Banknote size={14} className="text-leaf" /> Payment Method
                </h3>
                <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-leaf bg-leaf/5 cursor-pointer">
                  <input type="radio" name="payment" checked readOnly className="accent-leaf" />
                  <div>
                    <p className="text-sm font-medium text-ink">Cash on Delivery (COD)</p>
                    <p className="text-xs text-ink/50">Pay ₹{COD_FEE} extra at delivery</p>
                  </div>
                </label>
              </div>

              {orderError && (
                <div className="flex gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {orderError}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={submitting || submitted}
                className="w-full rounded-xl bg-leaf text-white font-semibold py-4 text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  "Placing Order…"
                ) : (
                  <><Package size={18} /> Place Order — ₹{total.toFixed(0)}</>
                )}
              </button>
              <p className="text-center text-xs text-ink/40 -mt-2">
                By placing the order you agree to our terms and conditions.
              </p>
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
                <span>Subtotal</span><span>₹{sub.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600">Free</span> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-ink/60">
                <span>COD Charge</span><span>₹{COD_FEE}</span>
              </div>
              <div className="border-t border-ink/8 pt-2 flex justify-between font-semibold text-ink">
                <span>Total Payable</span><span>₹{total.toFixed(0)}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink/40 text-center">
              Inclusive of all taxes · Free returns within 7 days
            </p>
          </div>
        </aside>
      </div>
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
