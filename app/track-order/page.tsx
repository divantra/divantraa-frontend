import { redirect } from "next/navigation";

/** "Track Your Order" (footer) has no separate guest-tracking flow — orders (with live tracking info) already live in the account page. */
export default function TrackOrderPage() {
  redirect("/account?tab=orders");
}
