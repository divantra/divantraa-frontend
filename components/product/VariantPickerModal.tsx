"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ShoppingCart, Minus, Plus, Circle } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { usePromoConfig, bestPrice } from "@/hooks/usePromoConfig";
import { getVariantImages, getUnitPriceLabel } from "@/types/product";
import type { Product, ProductVariant } from "@/types/product";

export default function VariantPickerModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { data: promo } = usePromoConfig();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const variants = product.variants.filter((v) => v.isActive);

  return (
    // Below the login modal's z-index (60/61 in LoginModal.tsx) — if addItem() opens it
    // because the shopper isn't signed in, it must appear above this, not behind it.
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header: cart icon + product title + close */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink/8 shrink-0">
          <ShoppingCart size={18} className="text-forest shrink-0" />
          <h2 className="flex-1 min-w-0 truncate font-semibold text-ink text-sm sm:text-base">{product.title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink p-1 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Variant rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-ink/5">
          {variants.map((v) => (
            <VariantRow key={v.id} product={product} variant={v} promo={promo} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VariantRow({ product, variant, promo }: { product: Product; variant: ProductVariant; promo: ReturnType<typeof usePromoConfig>["data"] }) {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  useEffect(() => setIsClient(true), []);

  const cartQuantity = isClient ? getItemQuantity(variant.id) : 0;
  const image = getVariantImages(variant, product)[0] ?? "";
  const unitLabel = getUnitPriceLabel(variant);
  const best = bestPrice(Number(variant.price), promo);

  const handleAdd = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addItem({
        productId: product.id, variantId: variant.id, title: product.title,
        variantTitle: variant.title, slug: product.slug, price: Number(variant.price),
        compareAtPrice: variant.compareAtPrice ?? undefined, image,
      }, 1);
    }, 250);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-ink/5">
        {image ? <Image src={image} alt={variant.title} fill className="object-cover" /> : null}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{variant.title}</p>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="text-sm font-bold text-ink">₹{variant.price}</span>
          {variant.compareAtPrice && (
            <span className="text-xs text-ink/40 line-through">₹{variant.compareAtPrice}</span>
          )}
          {unitLabel && <span className="text-[11px] text-ink/40">{unitLabel}</span>}
        </div>
        {best !== null && (
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            <span>🏷️</span>
            <span className="font-semibold text-forest">Best Price ₹{best}</span>
            <span className="text-forest/70">with {promo!.promoCode}</span>
          </div>
        )}
      </div>

      {cartQuantity > 0 ? (
        <div className="animate-add-pop flex h-9 shrink-0 items-center justify-between overflow-hidden rounded-full bg-forest shadow-sm">
          <button onClick={() => updateQuantity(variant.id, cartQuantity - 1)} className="flex h-full w-8 items-center justify-center text-white hover:bg-white/10" aria-label="Decrease quantity">
            <Minus size={13} strokeWidth={2.5} />
          </button>
          <span className="w-5 text-center text-xs font-bold text-white">{cartQuantity}</span>
          <button onClick={() => updateQuantity(variant.id, cartQuantity + 1)} className="flex h-full w-8 items-center justify-center text-white hover:bg-white/10" aria-label="Increase quantity">
            <Plus size={13} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading}
          aria-label={`Add ${variant.title} to cart`}
          className="flex shrink-0 h-9 w-9 items-center justify-center rounded-full bg-forest text-white shadow-sm transition-colors hover:bg-leaf disabled:opacity-60"
        >
          {loading ? <Circle className="h-3.5 w-3.5 animate-spin text-white" /> : <ShoppingCart size={15} />}
        </button>
      )}
    </div>
  );
}
