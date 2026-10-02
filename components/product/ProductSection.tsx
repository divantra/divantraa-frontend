"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import ProductVariantCard from "./ProductVariantCard";
import VariantPickerModal from "./VariantPickerModal";
import { usePromoConfig } from "@/hooks/usePromoConfig";
import { getVariantImages } from "@/types/product";
import type { Product } from "@/types/product";

/** One product: a banner (photo + title + tagline) followed by a single horizontally-scrollable row of its variants. */
export default function ProductSection({ product }: { product: Product }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: promo } = usePromoConfig();
  const variants = [...product.variants].filter((v) => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => { updateScrollState(); }, [variants.length]);

  function scrollByCards(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * scrollRef.current.clientWidth * 0.85, behavior: "smooth" });
  }

  if (variants.length === 0) return null;
  const bannerImage = getVariantImages(variants[0], product)[0] ?? product.images[0] ?? "";

  return (
    <section>
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-cream px-5 py-4 sm:px-7 sm:py-5">
        <div className="min-w-0 flex-1 order-2 sm:order-1">
          <Link href={`/products/${product.slug}`}>
            <h2 className="font-display text-xl sm:text-2xl text-forest">{product.title}</h2>
          </Link>
          {product.shortDescription && (
            <p className="mt-1 text-sm text-ink/60 max-w-xl">{product.shortDescription}</p>
          )}
          {product.certifications?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {product.certifications.map((c) => (
                <span key={c} className="text-[11px] text-forest/80 border border-forest/20 bg-white px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            {variants.length > 1 && (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-medium text-white hover:bg-leaf transition-colors"
              >
                <ShoppingCart size={14} /> See all sizes
              </button>
            )}
            <Link href={`/products/${product.slug}`} className="text-xs font-medium text-forest hover:underline">
              View all →
            </Link>
          </div>
        </div>
        {bannerImage && (
          <div className="relative order-1 sm:order-2 h-28 w-full sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image src={bannerImage} alt={product.title} fill sizes="(max-width: 640px) 100vw, 96px" className="object-cover" />
          </div>
        )}
      </div>

      {/* Variants — single row, horizontally scrollable with arrow navigation */}
      <div className="relative mt-3">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Scroll to previous variants"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest shadow-md hover:bg-cream transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory px-4 sm:px-5 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {variants.map((v) => (
            <ProductVariantCard key={v.id} product={product} variant={v} promo={promo} onOpenPicker={() => setPickerOpen(true)} />
          ))}
        </div>
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Scroll to more variants"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-forest shadow-md hover:bg-cream transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {pickerOpen && <VariantPickerModal product={product} onClose={() => setPickerOpen(false)} />}
    </section>
  );
}
