import type { Metadata } from "next";
import AccountContent from "@/components/Account/AccountContent";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Divantraa profile, view past orders, and manage addresses.",
};

export default function AccountPage() {
  return <AccountContent />;
}
