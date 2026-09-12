"use client";

import { usePathname } from "next/navigation";
import { HeroCarousel } from "@/components/home/HeroCarousel";

// Pages where the hero carousel should NOT appear.
// The carousel is a homepage-only element (mirrors anveshan.farm).
const NO_CAROUSEL_PATHS = [
  "/about",
  "/contact",
  "/account",
  "/admin",
  "/checkout",
  "/login",
  "/products",   // product listing and detail pages (starts-with check below)
];

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Show only on the exact home page "/"
  const showCarousel = pathname === "/";

  return (
    <>
      {showCarousel && <HeroCarousel />}
      {children}
    </>
  );
}
