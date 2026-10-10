import type { Metadata } from "next";
import AdminContent from "@/components/Admin/AdminContent";

export const metadata: Metadata = {
  title: "Admin Dashboard | Divantraa Store Operations",
  description: "Divantraa Admin Portal.",
};

const VALID_TABS = [
  "overview",
  "orders",
  "payments",
  "shipping",
  "notifications",
  "products",
  "users",
] as const;

export function generateStaticParams() {
  return VALID_TABS.map((tab) => ({ tab }));
}

interface AdminTabProps {
  params: Promise<{ tab: string }>;
}

export default async function AdminTabPage({ params }: AdminTabProps) {
  const { tab } = await params;
  return <AdminContent initialTab={tab} />;
}
