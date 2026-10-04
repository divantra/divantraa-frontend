import type { Metadata } from "next";
import PaymentReturnContent from "./PaymentReturnContent";

export const metadata: Metadata = {
  title: "Payment Status",
  description: "Confirming your payment status with Divantraa.",
};

export default function PaymentReturnPage() {
  return <PaymentReturnContent />;
}
