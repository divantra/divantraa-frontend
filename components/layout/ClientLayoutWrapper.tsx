"use client";

import { usePathname } from "next/navigation";
import { HeroCarousel } from "@/components/home/HeroCarousel";

// Pages where the hero carousel should appear — the homepage and the all-products listing.
const CAROUSEL_PATHS = ["/", "/products"];

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showCarousel = CAROUSEL_PATHS.includes(pathname);

  return (
    <>
      {showCarousel && <HeroCarousel />}
      {children}
    </>
  );
}
