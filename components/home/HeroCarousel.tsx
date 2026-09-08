"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// const slides = [
//   {
//     title: "A2 Ghee, made the old way",
//     subtitle: "Bilona-churned, lab-tested, delivered fresh.",
//     cta: "Shop Ghee",
//     image: "/images/slider/hero_caurosel_1.jpeg",
//     href: "/products?category=ghee",
//   },
//   {
//     title: "Wood cold-pressed oils",
//     subtitle: "Extracted slowly, the way your grandmother would approve of.",
//     cta: "Shop Oils",
//     image: "/images/hero_caurosel_2.jpeg",
//     href: "/products?category=cold-pressed-oils",
//   },
// ];

const slides = [
  {
    title: "Pure. Traditional. Divantraa.",
    subtitle:
      "Bringing authentic, traditionally crafted foods from our roots to your home.",
    cta: "Shop Ghee",
    href: "/products?category=ghee",
  },
  {
    title: "Goodness, made the traditional way",
    subtitle:
      "Thoughtfully crafted with time-honoured methods and quality ingredients.",
    cta: "Shop Oils",
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
      {/* <AnimatePresence initial={false} mode="wait">
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
      </AnimatePresence> */}

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-cream/70">
              DIVANTRAA
            </p>

            <h1 className="text-4xl font-semibold leading-tight text-cream md:text-6xl">
              {slide.title}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cream/80 md:text-xl">
              {slide.subtitle}
            </p>

            <a
              href={slide.href}
              className="mt-8 inline-flex rounded-full bg-cream px-7 py-3 font-medium text-forest transition-colors hover:bg-cream/90"
            >
              {slide.cta}
            </a>
          </div>
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
