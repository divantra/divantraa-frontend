"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "A2 Ghee, made the old way",
    subtitle: "Bilona-churned, lab-tested, delivered fresh.",
    cta: "Shop Ghee",
    image: "/images/hero_caurosel_1.jpeg",
    href: "/products?category=ghee",
  },
  {
    title: "Wood cold-pressed oils",
    subtitle: "Extracted slowly, the way your grandmother would approve of.",
    cta: "Shop Oils",
    image: "/images/hero_caurosel_2.jpeg",
    href: "/products?category=cold-pressed-oils",
  },
];

/** Simple autoplaying hero carousel with smooth crossfade + slide transitions. */
export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => {
    setIndex((i) => (i + 1) % slides.length);
  };

  const prevSlide = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const t = setInterval(nextSlide, 5000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];

  return (
    <section className="relative h-[50vh] min-h-[360px] bg-forest overflow-hidden">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </motion.div>
      </AnimatePresence>

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-cream/20 hover:bg-cream/40 transition-colors"
      >
        <ChevronLeft className="text-cream" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-cream/20 hover:bg-cream/40 transition-colors"
      >
        <ChevronRight className="text-cream" />
      </button>
    </section>
  );
}
