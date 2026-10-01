"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Flame } from "lucide-react";
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
  const sellingFast = variant.trackInventory && variant.stock > 0 && variant.stock <= variant.lowStockAlert;

  return (
    <Link
      href={`/products/${product.slug}`}
      data-variant-card
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-cream overflow-hidden">
        {image ? (
          <Image src={image} alt={variant.title} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink/30">No image</div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          {off > 0 ? (
            <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-semibold text-white">{off}% OFF</span>
          ) : product.isFeatured ? (
            <span className="flex items-center gap-0.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-white">
              <Star size={9} className="fill-white" /> Best Seller
            </span>
          ) : <span />}
          {sellingFast && !soldOut && (
            <span className="flex items-center gap-0.5 rounded-full bg-clay px-2 py-0.5 text-[10px] font-semibold text-white">
              <Flame size={9} className="fill-white" /> Selling fast
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <p className="text-xs font-medium text-ink/70 truncate">{variant.title}</p>

        {typeof product.avgRating === "number" && (product.reviewCount ?? 0) > 0 && (
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-ink/50">
            <Star size={10} className="fill-gold text-gold" /> {product.avgRating.toFixed(1)} ({product.reviewCount})
          </span>
        )}

        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
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
