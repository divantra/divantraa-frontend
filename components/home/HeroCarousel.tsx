"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const slides = [
  {
    title: "A2 Ghee, made the old way",
    subtitle: "Bilona-churned, lab-tested, delivered fresh.",
    cta: "Shop Ghee",
    href: "/products?category=ghee",
  },
  {
    title: "Wood cold-pressed oils",
    subtitle: "Extracted slowly, the way your grandmother would approve of.",
    cta: "Shop Oils",
    href: "/products?category=cold-pressed-oils",
  },
];

/** Simple autoplaying hero carousel with smooth crossfade + slide transitions. */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];

  return (
    <section className="relative h-[70vh] min-h-[420px] bg-forest overflow-hidden flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="relative z-10 max-w-7xl mx-auto px-6 w-full"
        >
          <span className="text-gold text-xs uppercase tracking-[0.2em] font-medium">
            Farm to home
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-cream mt-4 mb-5 max-w-xl leading-[1.1]">
            {slide.title}
          </h1>
          <p className="text-cream/70 max-w-md mb-8">{slide.subtitle}</p>
          <Link
            href={slide.href}
            className="inline-block rounded-full bg-clay text-cream px-7 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {slide.cta}
          </Link>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(211,162,74,0.2),transparent_60%)]" />

      <div className="absolute bottom-6 left-6 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-gold" : "w-1.5 bg-cream/30"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
