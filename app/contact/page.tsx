import type { Metadata } from "next";
import ContactUs from "@/components/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Divantraa for orders, farm traceability, and customer inquiries.",
};

export default function ContactPage() {
  return <ContactUs />;
}