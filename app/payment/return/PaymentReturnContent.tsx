"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { getAxiosErrorStatus } from "@/lib/errorUtils";

type Status = "PAID" | "PENDING" | "FAILED" | "EXPIRED";

const POLL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

/**
 * Cashfree sends the customer here after paying (and our checkout sends them here after an in-app
 * approval). We never trust what the browser says: this page asks OUR server, which asks Cashfree
 * server-to-server, and only then moves on. Works even if the login session lapsed meanwhile.
 */
export default function PaymentReturnContent() {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refunding, setRefunding] = useState(false);
  // Cashfree's hosted page sends the customer back here the moment they hit its own "back"/close control —
  // even if they never touched a payment method. `attempted: false` on the very first check catches exactly
  // that case, so we can say so immediately instead of spinning for a payment that was never started.
  const [abandoned, setAbandoned] = useState(false);

  useEffect(() => {
    document.title = "Payment Status - Divantraa";
  }, []);

  useEffect(() => {
    const orderNumber = new URLSearchParams(window.location.search).get("order_id");
    if (!orderNumber) {
      router.replace("/");
      return;
    }
    let cancelled = false;

    async function poll() {
      for (let i = 0; i < MAX_POLLS && !cancelled; i++) {
        try {
          const { data } = await api.get<{ data: { status: Status; orderId?: string; reason?: string; refunding?: boolean; attempted?: boolean } }>(
            `/orders/payment-status/${encodeURIComponent(orderNumber!)}`,
          );
          const st = data.data;
          if (st.status === "PAID" && st.orderId) {
            clearCart();
            router.replace(`/order-confirmation/${st.orderId}?paid=1`);
            return;
          }
          if (st.status === "FAILED") {
            router.replace(`/checkout?pay=failed&reason=${encodeURIComponent(st.reason ?? "The payment could not be completed.")}`);
            return;
          }
          if (st.status === "EXPIRED" && st.refunding) {
            // Money arrived after the session expired and the items were gone: it is being refunded automatically.
            setRefunding(true);
            return;
          }
          if (st.status === "EXPIRED") {
            router.replace(`/checkout?pay=failed&reason=${encodeURIComponent("The payment window expired.")}`);
            return;
          }
          if (st.status === "PENDING" && i === 0 && st.attempted === false) {
            setAbandoned(true);
            return;
          }
        } catch (e) {
          if (getAxiosErrorStatus(e) === 404) {
            setError("We couldn't find that order.");
            return;
          }
          // network hiccup: keep trying
        }
        if (i >= 2) setSlow(true);
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      if (!cancelled) setError("We're still waiting for your bank to confirm the payment.");
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [router, clearCart]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {abandoned ? (
        <>
          <ShieldCheck size={40} className="mb-4 text-ink/30" />
          <h1 className="font-display text-2xl text-ink">Payment not completed</h1>
          <p className="mt-2 text-sm text-ink/60">
            You left the payment page before choosing how to pay, so nothing was charged. Your cart is still saved.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/checkout" className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white">Back to checkout</Link>
            <Link href="/" className="rounded-xl border-2 border-forest px-5 py-3 text-sm font-semibold text-forest">Continue shopping</Link>
          </div>
        </>
      ) : refunding ? (
        <>
          <ShieldCheck size={40} className="mb-4 text-forest" />
          <h1 className="font-display text-2xl text-ink">Your payment arrived after the session expired</h1>
          <p className="mt-2 text-sm text-ink/60">
            We couldn&apos;t hold your order any longer, so we&apos;re refunding the full amount to your original payment method
            automatically. It usually shows up within 5–7 business days. You don&apos;t need to do anything.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/account?tab=orders" className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white">My Orders</Link>
            <Link href="/" className="rounded-xl border-2 border-forest px-5 py-3 text-sm font-semibold text-forest">Continue shopping</Link>
          </div>
        </>
      ) : error ? (
        <>
          <ShieldCheck size={40} className="mb-4 text-ink/30" />
          <h1 className="font-display text-2xl text-ink">{error}</h1>
          <p className="mt-2 text-sm text-ink/60">
            If money was deducted, don&apos;t worry — it is confirmed automatically and you will see the order under My Orders.
            You will not be charged twice.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/account?tab=orders" className="rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white">My Orders</Link>
            <Link href="/checkout" className="rounded-xl border-2 border-forest px-5 py-3 text-sm font-semibold text-forest">Back to checkout</Link>
          </div>
        </>
      ) : (
        <>
          <Loader2 size={40} className="mb-4 animate-spin text-forest" />
          <h1 className="font-display text-2xl text-ink">Confirming your payment…</h1>
          <p className="mt-2 text-sm text-ink/60">
            {slow ? "This is taking longer than usual — your bank may still be processing it." : "Please don’t close or refresh this page."}
          </p>
          {slow && (
            <Link href="/checkout" className="mt-6 rounded-xl border-2 border-forest px-5 py-3 text-sm font-semibold text-forest">
              Cancel and return to checkout
            </Link>
          )}
        </>
      )}
    </main>
  );
}
