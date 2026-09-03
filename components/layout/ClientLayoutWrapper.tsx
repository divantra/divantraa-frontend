"use client";

import { usePathname } from "next/navigation";
import { HeroCarousel } from "@/components/home/HeroCarousel";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideCarousel = pathname === "/about" || pathname === "/contact";

  return (
    <>
      {!hideCarousel && <HeroCarousel />}
      {children}
    </>
  );
}
