"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  HeroSlide,
  getHeroSlidesForPath,
} from "@/lib/hero.config";
import { useHeroStore } from "@/store/useHeroStore";

export type { HeroSlide };

/**
 * Drop <NoHeroBanner /> inside any specific page file to completely disable
 * the hero banner/slider for that page.
 *
 * Example:
 * ```tsx
 * import { NoHeroBanner } from "@/components/home/HeroCarousel";
 *
 * export default function PrivacyPolicyPage() {
 *   return (
 *     <>
 *       <NoHeroBanner />
 *       <main>...</main>
 *     </>
 *   );
 * }
 * ```
 */
export function NoHeroBanner() {
  const setHeroDisabled = useHeroStore((s) => s.setHeroDisabled);
  useEffect(() => {
    setHeroDisabled(true);
    return () => setHeroDisabled(false);
  }, [setHeroDisabled]);
  return null;
}

export interface HeroCarouselProps {
  /** Optional custom slides. Overrides route-based configuration. */
  slides?: HeroSlide[];
  /** Force banner mode (single image view, no arrows or rotation) */
  isBanner?: boolean;
  /** Custom height class override (e.g. h-[300px] or h-[400px]) */
  heightClassName?: string;
  /** Custom container class */
  className?: string;
  /** Auto-play rotation interval in ms (default 8500ms) */
  autoPlayInterval?: number;
  /** Show slide indicators when in slider mode (default true) */
  showIndicators?: boolean;
}

function HeroCarouselContent({
  slides: propSlides,
  isBanner = false,
  heightClassName,
  className = "",
  autoPlayInterval = 8500,
  showIndicators = false,
}: HeroCarouselProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams?.get("category");
  const isHeroDisabled = useHeroStore((s) => s.isHeroDisabled);

  // If page requested to disable hero via <NoHeroBanner />, render nothing
  if (isHeroDisabled) {
    return null;
  }

  // Determine active slides: Prop override takes precedence, otherwise route-based lookup
  const activeSlides =
    propSlides && propSlides.length > 0
      ? propSlides
      : getHeroSlidesForPath(pathname, category);

  // If page is not configured to show a slider or banner (e.g. cart, checkout, account), render nothing
  if (!activeSlides || activeSlides.length === 0) {
    return null;
  }

  // If there's only 1 slide or explicit isBanner flag -> Keep like a static Hero Banner!
  const isSingleSlide = activeSlides.length === 1 || isBanner;

  return (
    <HeroCarouselRenderer
      slides={activeSlides}
      isSingleSlide={isSingleSlide}
      heightClassName={heightClassName}
      className={className}
      autoPlayInterval={autoPlayInterval}
      showIndicators={showIndicators}
      pathname={pathname}
      category={category}
    />
  );
}

interface RendererProps {
  slides: HeroSlide[];
  isSingleSlide: boolean;
  heightClassName?: string;
  className: string;
  autoPlayInterval: number;
  showIndicators: boolean;
  pathname: string;
  category?: string | null;
}

function HeroCarouselRenderer({
  slides,
  isSingleSlide,
  heightClassName,
  className,
  autoPlayInterval,
  showIndicators,
  pathname,
  category,
}: RendererProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Reset slide index when page route or category changes
  useEffect(() => {
    setIndex(0);
  }, [pathname, category]);

  const slideCount = slides.length;

  const nextSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setIndex((i) => (i + 1) % slideCount);
  }, [slideCount]);

  const prevSlide = useCallback(() => {
    if (slideCount <= 1) return;
    setIndex((i) => (i - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // Auto-play interval: ONLY active in Slider mode (disabled in single-image Banner mode)
  useEffect(() => {
    if (isSingleSlide || isPaused || slideCount <= 1) return;
    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [isPaused, isSingleSlide, slideCount, autoPlayInterval, nextSlide]);

  const currentSlide = slides[index] ?? slides[0];

  // Default height: Banners are slightly more compact than full multi-slide hero carousel
  const resolvedHeight =
    heightClassName ||
    (isSingleSlide
      ? "h-[240px] sm:h-[280px] md:h-[320px] lg:h-[360px]"
      : "h-[280px] sm:h-[320px] md:h-[360px] lg:h-[400px]");

  // ── CASE 1: SINGLE IMAGE BANNER MODE ─────────────────────────────────
  // When there is only 1 slide/image on a page:
  // - No navigation arrows (ChevronLeft / ChevronRight)
  // - No pagination indicators / dots
  // - No cycling animation or interval timers
  // - Displays as a sleek, crisp hero banner
  if (isSingleSlide) {
    return (
      <section
        className={`relative w-full ${resolvedHeight} max-w-[1920px] mx-auto overflow-hidden bg-neutral-950 ${className}`}
      >
        {/* Banner Background Image */}
        <div className="absolute inset-0">
          <Image
            src={currentSlide.image}
            alt={currentSlide.title || "Divantraa Banner"}
            fill
            priority
            sizes="100vw"
            quality={95}
            className="object-cover object-center"
            unoptimized
          />
          {/* Gentle soft gradient on the left for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Banner Content */}
        <div className="relative z-10 flex h-full items-center px-8 md:px-16 lg:px-24">
          <div className="max-w-2xl text-left">
            <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-cream drop-shadow-sm">
              {currentSlide.tag || "DIVANTRAA"}
            </p>

            {currentSlide.title && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white drop-shadow-md">
                {currentSlide.title}
              </h1>
            )}

            {currentSlide.subtitle && (
              <p className="mt-2.5 sm:mt-3 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-stone-100 drop-shadow">
                {currentSlide.subtitle}
              </p>
            )}

            {currentSlide.cta && currentSlide.href && (
              <Link
                href={currentSlide.href}
                className="mt-5 sm:mt-6 inline-flex items-center justify-center rounded-full bg-cream px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-neutral-900 shadow-md transition-all hover:bg-white hover:shadow-lg"
              >
                {currentSlide.cta}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── CASE 2: MULTI-SLIDE CAROUSEL MODE (e.g. Main Home Page) ──────────
  // When there are multiple slides:
  // - Interactive slider with Framer Motion transitions
  // - Left & Right chevron navigation arrows
  // - Auto-advance timer (paused on hover)
  // - Slide indicator dots
  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full ${resolvedHeight} max-w-[1920px] mx-auto overflow-hidden bg-neutral-950 ${className}`}
    >
      {/* Background Image — Full opacity with crisp colors and smooth crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide.image}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={currentSlide.image}
            alt={currentSlide.title || "Slide"}
            fill
            priority={index === 0}
            sizes="100vw"
            quality={95}
            className="object-cover object-center"
            unoptimized
          />

          {/* Gentle soft gradient on the left for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Text Content */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={`slider_${index}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative z-10 flex h-full items-center px-8 md:px-16 lg:px-24"
        >
          <div className="max-w-2xl text-left">
            <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] text-cream drop-shadow-sm">
              {currentSlide.tag || "DIVANTRAA"}
            </p>

            {currentSlide.title && (
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-white drop-shadow-md">
                {currentSlide.title}
              </h1>
            )}

            {currentSlide.subtitle && (
              <p className="mt-2.5 sm:mt-3 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-stone-100 drop-shadow">
                {currentSlide.subtitle}
              </p>
            )}

            {currentSlide.cta && currentSlide.href && (
              <Link
                href={currentSlide.href}
                className="mt-5 sm:mt-6 inline-flex items-center justify-center rounded-full bg-cream px-7 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-neutral-900 shadow-md transition-all hover:bg-white hover:shadow-lg"
              >
                {currentSlide.cta}
              </Link>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
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

      {/* Slide Indicators */}
      {showIndicators && (
        <div className="absolute bottom-4 sm:bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${i === index
                ? "w-7 bg-white shadow-sm"
                : "w-2 bg-white/50 hover:bg-white/80"
                }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Public export wrapped in a Suspense boundary for Next.js useSearchParams safety
 */
export function HeroCarousel(props: HeroCarouselProps) {
  return (
    <Suspense fallback={null}>
      <HeroCarouselContent {...props} />
    </Suspense>
  );
}

// Also export default for convenience
export default HeroCarousel;