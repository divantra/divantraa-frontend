"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

let lenis: Lenis | null = null;

/** Inertia-style page scroll (Lenis). Pauses whenever something locks body scroll (drawers, modals, mobile menu). */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false, // keep native touch scrolling on phones
      anchors: true,
      autoRaf: true,
      allowNestedScroll: true, // drawers, dropdowns and sliders keep their own scroll
    });

    // CartDrawer / LoginModal / mobile menu toggle body overflow: mirror that onto Lenis.
    const syncLock = () => {
      if (document.body.style.overflow === "hidden") lenis?.stop();
      else lenis?.start();
    };
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      observer.disconnect();
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // New page starts at the top without animating through the old one.
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
