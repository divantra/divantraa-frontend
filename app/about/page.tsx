import type { Metadata } from "next";
import AboutUs from "@/components/AboutUs";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Divantraa's journey, traditional wood-pressed oils, and farm-to-home purity.",
};

export default function AboutPage() {
  return (
    <div className="all-products">
      <AboutUs />
    </div>
  );
}
