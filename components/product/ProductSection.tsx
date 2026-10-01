"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import ProductVariantCard from "./ProductVariantCard";
import VariantPickerModal from "./VariantPickerModal";
import type { Product } from "@/types/product";

/** A small rotating accent palette so adjacent product sections read as visually distinct, Anveshan-style. */
const ACCENTS = [
  { border: "border-leaf",   text: "text-forest",  bg: "bg-leaf/5" },
  { border: "border-gold",   text: "text-amber-700",bg: "bg-gold/5" },
  { border: "border-sky-500",text: "text-sky-700",  bg: "bg-sky-50" },
  { border: "border-rose-400",text:"text-rose-700", bg: "bg-rose-50" },
  { border: "border-violet-400",text:"text-violet-700",bg:"bg-violet-50" },
];

/** One product, shown as a header + all of its active variants scrolling horizontally. */
export default function ProductSection({ product, accentIndex }: { product: Product; accentIndex: number }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const variants = [...product.variants].filter((v) => v.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  if (variants.length === 0) return null;
  const accent = ACCENTS[accentIndex % ACCENTS.length];
  const badge = product.badges?.[0];

  return (
    <section className={`rounded-2xl border-l-4 ${accent.border} ${accent.bg} py-4 pl-4 pr-2 sm:pl-5`}>
      <div className="flex items-center justify-between gap-3 pr-3 mb-3">
        <Link href={`/products/${product.slug}`} className="min-w-0">
          <h2 className={`font-display text-lg sm:text-xl truncate ${accent.text}`}>{product.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {badge && <span className="text-[11px] font-medium text-ink/50">{badge}</span>}
            <span className="flex items-center gap-1 text-[11px] text-ink/50">
              <Star size={11} className="fill-gold text-gold" /> 4.8
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          {variants.length > 1 && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label={`See all sizes of ${product.title}`}
              className={`flex items-center justify-center h-8 w-8 rounded-full bg-white/70 ${accent.text} hover:bg-white transition-colors`}
            >
              <ShoppingCart size={15} />
            </button>
          )}
          <Link href={`/products/${product.slug}`} className={`text-xs font-medium ${accent.text} hover:underline`}>
            View all →
          </Link>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {variants.map((v) => (
          <ProductVariantCard key={v.id} product={product} variant={v} onOpenPicker={() => setPickerOpen(true)} />
        ))}
      </div>

      {pickerOpen && <VariantPickerModal product={product} onClose={() => setPickerOpen(false)} />}
    </section>
  );
}
