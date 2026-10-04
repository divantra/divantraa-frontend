import type { Metadata } from "next";
import AdminContent from "@/components/Admin/AdminContent";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Divantraa Admin Portal.",
};

export default function AdminPage() {
  return <AdminContent />;
}
