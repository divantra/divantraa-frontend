"use client";

import { HeroCarousel } from "@/components/home/HeroCarousel";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeroCarousel />
      {children}
    </>
  );
}
