"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X, Package } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  title: string;
  badge?: string;
  activeImage: number;
  onSelectImage: (index: number) => void;
}

export function ProductImageGallery({
  images,
  title,
  badge,
  activeImage,
  onSelectImage,
}: ProductImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  const total = images.length;

  const nextImage = useCallback(() => {
    if (total <= 1) return;
    onSelectImage((activeImage + 1) % total);
  }, [activeImage, total, onSelectImage]);

  const prevImage = useCallback(() => {
    if (total <= 1) return;
    onSelectImage((activeImage - 1 + total) % total);
  }, [activeImage, total, onSelectImage]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // px

    if (distance > minSwipeDistance) {
      // Swiped left -> next
      nextImage();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      prevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextImage, prevImage]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailScrollRef.current) return;
    const container = thumbnailScrollRef.current;
    const thumbBtn = container.children[activeImage] as HTMLElement | undefined;
    if (thumbBtn) {
      const left = thumbBtn.offsetLeft - container.offsetWidth / 2 + thumbBtn.offsetWidth / 2;
      container.scrollTo({ left, behavior: "smooth" });
    }
  }, [activeImage]);

  const currentSrc = images[activeImage];

  return (
    <div className="md:sticky md:top-28 self-start w-full select-none">
      {/* ── Main Viewport ────────────────────────────────────────── */}
      <div
        className="group relative aspect-square rounded-3xl bg-white border border-ink/10 shadow-sm overflow-hidden mb-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentSrc ? (
          <>
            <Image
              key={currentSrc}
              src={currentSrc}
              alt={`${title} — image ${activeImage + 1} of ${total}`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
            />

            {/* Optional Top Floating Badge */}
            {badge && (
              <span className="absolute top-4 left-4 z-10 inline-flex items-center rounded-full bg-forest text-white text-xs font-semibold px-3 py-1 shadow-sm tracking-wide">
                {badge}
              </span>
            )}

            {/* Zoom Icon Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Enlarge image preview"
              className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-white/85 backdrop-blur-md border border-ink/10 text-ink/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white hover:text-ink shadow-sm"
            >
              <ZoomIn size={16} />
            </button>

            {/* Slide Arrows (visible if multiple images) */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  aria-label="Previous product image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 backdrop-blur-md border border-ink/10 text-ink/80 flex items-center justify-center shadow-md transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white hover:scale-105 active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  aria-label="Next product image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-white/90 backdrop-blur-md border border-ink/10 text-ink/80 flex items-center justify-center shadow-md transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white hover:scale-105 active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Counter Pill */}
                <div className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 pointer-events-none">
                  {activeImage + 1} / {total}
                </div>

                {/* Mobile Pagination Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 sm:hidden pointer-events-none">
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeImage ? "w-5 bg-forest" : "w-1.5 bg-ink/20"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink/20">
            <Package size={64} />
          </div>
        )}
      </div>

      {/* ── Thumbnail Strip ───────────────────────────────────────── */}
      {total > 1 && (
        <div className="relative">
          <div
            ref={thumbnailScrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-ink/10 scroll-smooth px-0.5"
            tabIndex={0}
            role="tablist"
            aria-label="Product thumbnails"
          >
            {images.map((img, i) => {
              const isSelected = i === activeImage;
              return (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={`Thumbnail ${i + 1} of ${total}`}
                  onClick={() => onSelectImage(i)}
                  className={`group/thumb shrink-0 h-18 w-18 sm:h-20 sm:w-20 rounded-2xl overflow-hidden relative border-2 transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? "border-forest ring-2 ring-forest/20 shadow-sm scale-100"
                      : "border-transparent opacity-60 hover:opacity-100 hover:border-ink/20"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${title} thumbnail ${i + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-200 group-hover/thumb:scale-105"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Lightbox Zoom Modal ───────────────────────────────────── */}
      {lightboxOpen && currentSrc && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            aria-label="Close zoom modal"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 z-20 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>

          {/* Previous in lightbox */}
          {total > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next in lightbox */}
          {total > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Large image */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-h-[80vh] aspect-square">
              <Image
                src={currentSrc}
                alt={`${title} — enlarged image ${activeImage + 1}`}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
              {activeImage + 1} / {total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductImageGallery;
