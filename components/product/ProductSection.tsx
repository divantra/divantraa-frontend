"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import ProductVariantCard from "./ProductVariantCard";
import VariantPickerModal from "./VariantPickerModal";
import { usePromoConfig } from "@/hooks/usePromoConfig";
import { getVariantImages } from "@/types/product";
import type { Product } from "@/types/product";

/** One product: a full-width banner (photo + title + tagline) followed by all of its active variants. */
export default function ProductSection({ product }: { product: Product }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data: promo } = usePromoConfig();
  const variants = [...product.variants].filter((v) => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  if (variants.length === 0) return null;
  const bannerImage = getVariantImages(variants[0], product)[0] ?? product.images[0] ?? "";

  return (
    <section className="overflow-hidden rounded-2xl border border-ink/8 bg-white">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-cream px-5 py-5 sm:px-7 sm:py-6">
        <div className="min-w-0 flex-1 order-2 sm:order-1">
          <Link href={`/products/${product.slug}`}>
            <h2 className="font-display text-2xl sm:text-3xl text-forest">{product.title}</h2>
          </Link>
          {product.shortDescription && (
            <p className="mt-1.5 text-sm text-ink/60 max-w-xl">{product.shortDescription}</p>
          )}
          {product.certifications?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.certifications.map((c) => (
                <span key={c} className="text-[11px] text-forest/80 border border-forest/20 bg-white px-2.5 py-1 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
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
          <div className="relative order-1 sm:order-2 h-40 w-full sm:h-36 sm:w-36 shrink-0 overflow-hidden rounded-xl bg-white">
            <Image src={bannerImage} alt={product.title} fill sizes="(max-width: 640px) 100vw, 144px" className="object-cover" />
          </div>
        )}
      </div>

      {/* Variants */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4 sm:p-5">
        {variants.map((v) => (
          <ProductVariantCard key={v.id} product={product} variant={v} promo={promo} onOpenPicker={() => setPickerOpen(true)} />
        ))}
      </div>

      {pickerOpen && <VariantPickerModal product={product} onClose={() => setPickerOpen(false)} />}
    </section>
  );
}
