"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { getVariantImages, getUnitPriceLabel, getDiscountPercent } from "@/types/product";
import { bestPrice, type PromoConfig } from "@/hooks/usePromoConfig";
import type { Product, ProductVariant } from "@/types/product";

/**
 * One variant shown as its own card — pure display (image, price, best price). It never adds to
 * cart or shows a quantity stepper directly; the cart icon always opens the variant picker popup
 * for the parent product, where the actual add/quantity controls live.
 */
export default function ProductVariantCard({
  product, variant, promo, onOpenPicker,
}: {
  product: Product; variant: ProductVariant; promo: PromoConfig | undefined; onOpenPicker: () => void;
}) {
  const image = getVariantImages(variant, product)[0] ?? "";
  const unitLabel = getUnitPriceLabel(variant);
  const off = getDiscountPercent(variant);
  const best = bestPrice(Number(variant.price), promo);
  const soldOut = variant.trackInventory && variant.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      data-variant-card
      className="group relative flex w-[160px] sm:w-[185px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-[150px] sm:h-[170px] w-full bg-white overflow-hidden">
        {image ? (
          <Image src={image} alt={variant.title} fill sizes="200px" className="object-cover p-1 transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink/30">No image</div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
        <p className="text-xs font-medium text-ink/70 truncate">{variant.title}</p>

        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-bold text-ink">₹{Number(variant.price).toLocaleString("en-IN")}</span>
          {off > 0 && <span className="text-[11px] text-ink/40 line-through">₹{Number(variant.compareAtPrice).toLocaleString("en-IN")}</span>}
        </div>
        {unitLabel && <p className="text-[10px] text-ink/40 mt-0.5">{unitLabel}</p>}

        {best !== null && (
          <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-leaf/10 px-1.5 py-1">
            <span className="text-[10px]">🏷️</span>
            <span className="text-[10px] font-semibold text-forest truncate">Best ₹{best} w/ {promo!.promoCode}</span>
          </div>
        )}

        <div className="mt-2">
          {soldOut ? (
            <span className="block text-center text-[11px] font-medium text-red-500 py-1.5">Out of stock</span>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenPicker(); }}
              aria-label={`Choose a size of ${product.title}`}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-forest text-white shadow-sm transition-colors hover:bg-leaf"
            >
              <ShoppingCart size={15} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
