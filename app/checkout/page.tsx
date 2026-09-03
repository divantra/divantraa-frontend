"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

interface ShippingForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const emptyForm: ShippingForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<ShippingForm>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = subtotal();

  function update<K extends keyof ShippingForm>(key: K, value: ShippingForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePayNow() {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const { data } = await api.post("/orders/create-razorpay-order", form);

      const options = {
        key: data.data.keyId,
        amount: data.data.amount,
        currency: data.data.currency,
        name: "Divantraa",
        description: "Order payment",
        order_id: data.data.razorpayOrderId,
        handler: async (response: any) => {
          await api.post("/orders/verify-payment", {
            orderId: data.data.orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          clearCart();
          router.push("/account");
        },
        prefill: {
          name: form.fullName,
          contact: form.phone,
        },
        theme: { color: "#3D6B45" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormValid = Object.values(form).every((v, i) =>
    Object.keys(form)[i] === "line2" ? true : v.trim().length > 0
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-[1.3fr_1fr] gap-12">
        <div>
          <h1 className="font-display text-3xl text-ink mb-8">Shipping details</h1>

          <div className="grid sm:grid-cols-2 gap-4">
            <input
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none sm:col-span-2"
            />
            <input
              placeholder="Phone number"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none sm:col-span-2"
            />
            <input
              placeholder="Address line 1"
              value={form.line1}
              onChange={(e) => update("line1", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none sm:col-span-2"
            />
            <input
              placeholder="Address line 2 (optional)"
              value={form.line2}
              onChange={(e) => update("line2", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none sm:col-span-2"
            />
            <input
              placeholder="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none"
            />
            <input
              placeholder="State"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none"
            />
            <input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => update("pincode", e.target.value)}
              className="rounded-xl border-2 border-ink/10 focus:border-leaf px-4 py-3 outline-none sm:col-span-2"
            />
          </div>

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </div>

        {/* Order summary */}
        <aside className="bg-white rounded-2xl border border-ink/5 p-6 h-fit">
          <h2 className="font-medium text-ink mb-4">Order summary</h2>
          <ul className="space-y-3 mb-4">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm text-ink/70">
                <span>{item.title} × {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink/10 pt-4 flex justify-between font-semibold text-ink mb-6">
            <span>Total</span>
            <span>₹{total.toFixed(0)}</span>
          </div>
          <button
            onClick={handlePayNow}
            disabled={!isFormValid || items.length === 0 || isSubmitting}
            className="w-full rounded-xl bg-leaf text-white font-medium py-3.5 disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? "Processing…" : "Pay with Razorpay"}
          </button>
        </aside>
      </main>
    </>
  );
}
