"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/image.utils";

const slides = [
  {
    title: "Pure. Traditional. Divantraa.",
    subtitle:
      "Bringing authentic, traditionally crafted foods from our roots to your home.",
    cta: "Shop Ghee",
    href: "/products",
    image: getImageUrl("public/slider/divantar_slider_1.jpg"),
  },
  {
    title: "Goodness, made the traditional way",
    subtitle:
      "Thoughtfully crafted with time-honoured methods and quality ingredients.",
    cta: "Shop Oils",
    href: "/products?category=wood-pressed-oils",
    image: getImageUrl("public/slider/divantar_slider_2.jpg"),
  },
  {
    title: "Pure Forest Honey, Untouched & Raw",
    subtitle:
      "Ethically harvested from wild forest canopies, rich in natural enzymes and aroma.",
    cta: "Shop Honey",
    href: "/products?category=raw-honey",
    image: getImageUrl("public/slider/divantar_slider_3.jpg"),
  },
  {
    title: "Heritage Spices & Ayurvedic Wellness",
    subtitle:
      "Single-origin turmeric, potent botanicals, and time-tested natural vitality.",
    cta: "Explore Wellness",
    href: "/products?category=wellness",
    image: getImageUrl("public/slider/divantar_slider_4.jpg"),
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    setIndex((i) => (i + 1) % slides.length);
  };

  const prevSlide = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(nextSlide, 8500);
    return () => clearInterval(t);
  }, [index, isPaused]);

  const slide = slides[index];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px] max-w-[1920px] mx-auto overflow-hidden bg-neutral-950"
    >
      {/* Background Image — Full opacity with crisp colors */}
      <AnimatePresence initial={false}>
        <motion.div
          key={slide.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={index === 0}
            sizes="100vw"
            quality={95}
            className="object-cover object-center"
          />

          {/* Gentle soft gradient on the left for text contrast without dimming the overall image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 flex h-full items-center px-8 md:px-16 lg:px-24"
        >
          <div className="max-w-2xl text-left">
            <p className="mb-2 text-xs md:text-sm font-semibold uppercase tracking-[0.25em] text-cream drop-shadow-sm">
              DIVANTRAA
            </p>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white drop-shadow-md">
              {slide.title}
            </h1>

            <p className="mt-2.5 sm:mt-3 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-stone-100 drop-shadow">
              {slide.subtitle}
            </p>

            <a
              href={slide.href}
              className="mt-5 sm:mt-6 inline-flex items-center justify-center rounded-full bg-cream px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-neutral-900 shadow-md transition-all hover:bg-white hover:shadow-lg"
            >
              {slide.cta}
            </a>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows — Kept in exact requested styling */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 backdrop-blur-sm transition-colors hover:bg-black/55 text-cream"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-2.5 backdrop-blur-sm transition-colors hover:bg-black/55 text-cream"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Slide Indicators — In center only */}
      {/* <div className="absolute bottom-4 sm:bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index
                ? "w-7 bg-white shadow-sm"
                : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div> */}
    </section>
  );
}