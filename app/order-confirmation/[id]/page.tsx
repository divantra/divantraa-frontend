"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, MapPin, Banknote, ArrowRight, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { rupees } from "@/hooks/useQuote";

interface OrderItem {
  id:           string;
  title:        string;
  variantTitle: string;
  sku:          string;
  price:        number;
  quantity:     number;
  images:       string[];
}

interface Order {
  id:               string;
  orderNumber:      string | null;
  status:           string;
  paymentMethod:    string;
  paymentStatus?:   string;
  paymentChannel?:  string | null;
  discount?:        number;
  subtotal:         number;
  shippingFee:      number;
  codFee:           number;
  total:            number;
  createdAt:        string;
  shippingName:     string;
  shippingPhone:    string;
  shippingLine1:    string;
  shippingLine2:    string | null;
  shippingCity:     string;
  shippingState:    string;
  shippingPincode:  string;
  shippingLandmark: string | null;
  items:            OrderItem[];
}

const CHANNEL_LABEL: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet" };

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn:  () => api.get(`/orders/${id}`).then((r) => r.data.data),
    retry:    false,
    // Online order still waiting for the payment gateway to confirm: keep checking.
    refetchInterval: (q) => {
      const o = q.state.data as Order | undefined;
      return o && o.paymentMethod === "ONLINE" && o.paymentStatus === "PENDING" ? 3000 : false;
    },
  });

  if (isLoading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-ink/10 mx-auto" />
          <div className="h-8 bg-ink/10 rounded-xl max-w-xs mx-auto" />
          <div className="h-4 bg-ink/5 rounded-xl max-w-sm mx-auto" />
        </div>
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Package size={48} className="mx-auto text-ink/15 mb-4" />
        <h1 className="font-display text-2xl text-ink mb-2">Order not found</h1>
        <Link href="/account?tab=orders" className="text-leaf hover:underline">
          View all orders →
        </Link>
      </main>
    );
  }

  const displayId = order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">

      {/* Success header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
          <CheckCircle2 size={44} className="text-green-500" />
        </div>
        <h1 className="font-display text-3xl text-ink mb-2">Order Placed!</h1>
        <p className="text-ink/60">
          Thank you for your order. We&apos;ll start processing it shortly.
        </p>
        <div className="mt-3 inline-block bg-leaf/10 text-leaf text-sm font-medium px-4 py-1.5 rounded-full">
          {displayId}
        </div>
      </div>

      {/* Order details card */}
      <div className="bg-white rounded-2xl border border-ink/8 shadow-sm divide-y divide-ink/5">

        {/* Payment method */}
        <div className="px-6 py-4 flex items-center gap-3">
          <Banknote size={18} className="text-leaf shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : `Online Payment${order.paymentChannel ? ` · ${CHANNEL_LABEL[order.paymentChannel] ?? order.paymentChannel}` : ""}`}
            </p>
            <p className="text-xs text-ink/50">
              {order.paymentMethod === "COD"
                ? "Pay at the time of delivery"
                : order.paymentStatus === "PAID"
                ? "Payment received — thank you!"
                : "Confirming your payment…"}
            </p>
          </div>
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-medium px-2.5 py-1 rounded-full">
            {order.status}
          </span>
        </div>

        {/* Delivery address */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin size={12} /> Delivery Address
          </p>
          <p className="text-sm font-medium text-ink">{order.shippingName}</p>
          <p className="text-sm text-ink/60">
            {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            {order.shippingLandmark ? `, ${order.shippingLandmark}` : ""}
          </p>
          <p className="text-sm text-ink/60">
            {order.shippingCity}, {order.shippingState} — {order.shippingPincode}
          </p>
          <p className="text-xs text-ink/40 mt-0.5">📞 {order.shippingPhone}</p>
        </div>

        {/* Items */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">
            Items Ordered
          </p>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="h-14 w-14 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                  ) : (
                    <Package size={20} className="m-auto text-ink/20 absolute inset-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink/50">{item.variantTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-ink">₹{Number(item.price) * item.quantity}</p>
                  <p className="text-xs text-ink/40">Qty {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Price breakdown */}
        <div className="px-6 py-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>Shipping</span>
              <span>
                {Number(order.shippingFee) === 0
                  ? <span className="text-green-600">Free</span>
                  : `₹${Number(order.shippingFee)}`}
              </span>
            </div>
            {Number(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Online payment discount</span><span>−{rupees(Number(order.discount))}</span>
              </div>
            )}
            {Number(order.codFee) > 0 && (
              <div className="flex justify-between text-ink/60">
                <span>COD Charge</span><span>₹{Number(order.codFee)}</span>
              </div>
            )}
            <div className="border-t border-ink/8 pt-2 flex justify-between font-semibold text-ink">
              <span>Total</span><span>{rupees(Number(order.total))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/account?tab=orders"
          className="flex-1 rounded-xl border-2 border-leaf text-leaf font-medium py-3.5 text-center hover:bg-leaf/5 transition-colors flex items-center justify-center gap-2"
        >
          <Package size={16} /> View Orders
        </Link>
        <Link
          href="/products"
          className="flex-1 rounded-xl bg-leaf text-white font-medium py-3.5 text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} /> Continue Shopping <ArrowRight size={14} />
        </Link>
      </div>

      <p className="text-center text-xs text-ink/30 mt-6">
        Order placed on{" "}
        {new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "long", year: "numeric",
        })}
      </p>
    </main>
  );
}
