import type { Metadata } from "next";
import CheckoutContent from "./CheckoutContent";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order securely with Divantraa.",
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
