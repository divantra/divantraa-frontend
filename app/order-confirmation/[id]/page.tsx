import type { Metadata } from "next";
import OrderConfirmationContent from "@/components/OrderConfirmation/OrderConfirmationContent";

export const metadata: Metadata = {
  title: "Order Confirmation",
  description: "Thank you for your order with Divantraa.",
};

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  return <OrderConfirmationContent params={params} />;
}
