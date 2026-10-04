import type { Metadata } from "next";
import CartContent from "@/components/cart/CartContent";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "View and manage items in your Divantraa shopping cart.",
};

export default function CartPage() {
  return <CartContent />;
}
