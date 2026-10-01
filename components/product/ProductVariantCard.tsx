"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Circle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { getVariantImages, getUnitPriceLabel, getDiscountPercent } from "@/types/product";
import type { Product, ProductVariant } from "@/types/product";

/** Same convention used across the app's "Best Price" displays. */
const PROMO_CODE = "PURE15";
const PROMO_PERCENT = 0.15;

/** One variant shown as its own card — used inside a horizontally-scrollable product section. */
export default function ProductVariantCard({ product, variant }: { product: Product; variant: ProductVariant }) {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  useEffect(() => setIsClient(true), []);

  const cartQuantity = isClient ? getItemQuantity(variant.id) : 0;
  const image = getVariantImages(variant, product)[0] ?? "";
  const unitLabel = getUnitPriceLabel(variant);
  const off = getDiscountPercent(variant);
  const bestPrice = Math.round(Number(variant.price) * (1 - PROMO_PERCENT));
  const soldOut = variant.trackInventory && variant.stock === 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addItem({
        productId: product.id, variantId: variant.id, title: product.title,
        variantTitle: variant.title, slug: product.slug, price: Number(variant.price),
        compareAtPrice: variant.compareAtPrice ?? undefined, image,
      }, 1);
      useUiStore.getState().openAddOns(product.id);
    }, 250);
  };

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

        <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-leaf/10 px-1.5 py-1">
          <span className="text-[10px]">🏷️</span>
          <span className="text-[10px] font-semibold text-forest truncate">Best ₹{bestPrice} w/ {PROMO_CODE}</span>
        </div>

        <div className="mt-2">
          {soldOut ? (
            <span className="block text-center text-[11px] font-medium text-red-500 py-1.5">Out of stock</span>
          ) : cartQuantity > 0 ? (
            <div className="flex h-8 items-center justify-between overflow-hidden rounded-full bg-forest shadow-sm">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(variant.id, cartQuantity - 1); }} className="flex h-full w-7 items-center justify-center text-white hover:bg-white/10" aria-label="Decrease quantity">
                <Minus size={12} strokeWidth={2.5} />
              </button>
              <span className="text-xs font-bold text-white">{cartQuantity}</span>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(variant.id, cartQuantity + 1); }} className="flex h-full w-7 items-center justify-center text-white hover:bg-white/10" aria-label="Increase quantity">
                <Plus size={12} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={loading}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-forest text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-leaf disabled:opacity-60"
            >
              {loading ? <Circle className="h-3.5 w-3.5 animate-spin" /> : <>ADD <ShoppingCart size={13} /></>}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
