"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Star, FileCheck, ShoppingBag, Minus, Plus, Package } from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import type { Product } from "@/types/product";
import {
  getDefaultVariant,
  getVariantImages,
  groupVariantOptions,
} from "@/types/product";

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, updateQuantity, getItemQuantity, openCart } = useCartStore();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  // Variant selector — track which option value is selected per option key
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get<{ data: Product }>(`/products/${slug}`)).data.data,
    // After data loads, initialise selected options from the default variant
    select: (product) => {
      return product;
    },
  });

  // ── Derive selected variant from option state ─────────────────
  //
  // On first load selectedOptions is empty — fall back to the product's
  // default variant. After the user clicks an option chip the matching
  // variant is resolved from the full options map.

  const product = data;

  const activeVariant = (() => {
    if (!product) return undefined;
    const def = getDefaultVariant(product);
    if (Object.keys(selectedOptions).length === 0) return def;

    // Find a variant that matches all currently selected options
    return (
      product.variants.find(
        (v) =>
          v.isActive &&
          Object.entries(selectedOptions).every(([k, val]) => v.options[k] === val)
      ) ?? def
    );
  })();

  // Images for the current variant (falls back to product images automatically)
  const displayImages = (() => {
    if (!product || !activeVariant) return product?.images ?? [];
    return getVariantImages(activeVariant, product);
  })();

  // Reset the active thumbnail when the variant (and therefore images) change
  const [prevVariantId, setPrevVariantId] = useState<string | undefined>();
  if (activeVariant?.id !== prevVariantId) {
    setActiveImage(0);
    setPrevVariantId(activeVariant?.id);
  }

  const cartQuantity = activeVariant ? getItemQuantity(activeVariant.id) : 0;

  // ── Grouped options for the variant selector UI ───────────────
  const optionGroups = product ? groupVariantOptions(product.variants) : {};

  // ── Cart actions ──────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!product || !activeVariant) return;
    startTransition(() => {
      addItem(
        {
          productId:    product.id,
          variantId:    activeVariant.id,
          title:        product.title,
          variantTitle: activeVariant.title,
          slug:         product.slug,
          price:        Number(activeVariant.price),
          image:        displayImages[0] ?? "",
        },
        1
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  };

  const handleBuyNow = () => {
    if (!product || !activeVariant) return;
    startTransition(() => {
      addItem({
        productId:    product.id,
        variantId:    activeVariant.id,
        title:        product.title,
        variantTitle: activeVariant.title,
        slug:         product.slug,
        price:        Number(activeVariant.price),
        image:        displayImages[0] ?? "",
      });
      openCart();
    });
  };

  // ── Loading / not found states ────────────────────────────────
  if (isLoading || !product) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-20 text-ink/40">
        {isLoading ? "Loading product…" : "Product not found."}
      </main>
    );
  }

  const inStock = !activeVariant || activeVariant.stock > 0;
  const lowStock =
    activeVariant &&
    activeVariant.trackInventory &&
    activeVariant.stock > 0 &&
    activeVariant.stock <= activeVariant.lowStockAlert;

  return (
    <>
      <CartDrawer />

      <main className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-12">

        {/* ── Image gallery ─────────────────────────────────── */}
        <div>
          {/* Main image */}
          <div className="aspect-square rounded-2xl bg-ink/5 relative overflow-hidden mb-4">
            {displayImages[activeImage] ? (
              <Image
                key={displayImages[activeImage]}
                src={displayImages[activeImage]}
                alt={`${product.title} — image ${activeImage + 1}`}
                fill
                className="object-cover transition-opacity duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ink/20">
                <Package size={64} />
              </div>
            )}
          </div>

          {/* Thumbnail strip — shows all images for the active variant */}
          {displayImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {displayImages.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 relative ${
                    i === activeImage ? "border-leaf" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ──────────────────────────────────── */}
        <div>
          <h1 className="font-display text-3xl text-ink mb-2">{product.title}</h1>

          {/* Rating */}
          {!!product.reviewCount && (
            <div className="flex items-center gap-1 mb-4 text-sm text-ink/60">
              <Star size={14} className="fill-gold text-gold" />
              {product.avgRating?.toFixed(1)} · {product.reviewCount} review
              {product.reviewCount !== 1 ? "s" : ""}
            </div>
          )}

          {/* Variant title */}
          {activeVariant && (
            <p className="text-sm text-ink/50 mb-1">{activeVariant.title}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            {activeVariant ? (
              <>
                <span className="text-2xl font-semibold text-ink">
                  ₹{Number(activeVariant.price)}
                </span>
                {activeVariant.compareAtPrice && (
                  <>
                    <span className="text-ink/40 line-through text-base">
                      ₹{Number(activeVariant.compareAtPrice)}
                    </span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {Math.round(
                        ((activeVariant.compareAtPrice - activeVariant.price) /
                          activeVariant.compareAtPrice) *
                          100
                      )}% off
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-sm text-ink/40">Select a variant</span>
            )}
          </div>

          {/* Short description */}
          <p className="text-ink/60 leading-relaxed mb-5">{product.shortDescription}</p>

          {/* ── Variant selector ───────────────────────────── */}
          {Object.entries(optionGroups).map(([optionKey, optionValues]) => (
            <div key={optionKey} className="mb-4">
              <p className="text-sm font-medium text-ink mb-2">{optionKey}</p>
              <div className="flex flex-wrap gap-2">
                {optionValues.map((val) => {
                  // Find the variant for this option value to check stock
                  const matchingVariant = product.variants.find(
                    (v) => v.isActive && v.options[optionKey] === val
                  );
                  const outOfStock =
                    matchingVariant?.trackInventory && matchingVariant.stock === 0;
                  const isSelected =
                    (selectedOptions[optionKey] ?? activeVariant?.options[optionKey]) === val;

                  return (
                    <button
                      key={val}
                      onClick={() =>
                        setSelectedOptions((prev) => ({ ...prev, [optionKey]: val }))
                      }
                      disabled={outOfStock}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        isSelected
                          ? "border-leaf bg-leaf text-white shadow-sm"
                          : outOfStock
                          ? "border-ink/10 text-ink/30 line-through cursor-not-allowed"
                          : "border-ink/20 text-ink hover:border-leaf/60 hover:bg-leaf/5"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Stock status */}
          {activeVariant && (
            <div className="mb-5">
              {!inStock ? (
                <p className="text-xs font-medium text-red-500">Out of stock</p>
              ) : lowStock ? (
                <p className="text-xs font-medium text-amber-500">
                  Only {activeVariant.stock} left — order soon
                </p>
              ) : (
                <p className="text-xs text-green-600">In stock</p>
              )}
            </div>
          )}

          {/* Badges */}
          {product.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {product.badges.map((b) => (
                <span
                  key={b}
                  className="text-xs font-medium bg-leaf/10 text-leaf px-3 py-1.5 rounded-full"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Cart actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {cartQuantity > 0 ? (
              <div className="flex items-center justify-center border-2 border-leaf rounded-xl col-span-1">
                <button
                  onClick={() => activeVariant && updateQuantity(activeVariant.id, cartQuantity - 1)}
                  className="p-3.5 text-leaf"
                  aria-label="Decrease"
                >
                  <Minus size={18} />
                </button>
                <span className="px-3 font-medium text-sm">{cartQuantity} in cart</span>
                <button
                  onClick={() => activeVariant && updateQuantity(activeVariant.id, cartQuantity + 1)}
                  className="p-3.5 text-leaf"
                  aria-label="Increase"
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isPending || !inStock || !activeVariant}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-leaf text-leaf font-medium py-3.5 hover:bg-leaf/5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingBag size={18} />
                {isPending ? "Adding…" : added ? "Added! ✓" : "Add to cart"}
              </button>
            )}
            <button
              onClick={handleBuyNow}
              disabled={!inStock || !activeVariant}
              className="rounded-xl bg-leaf text-white font-medium py-3.5 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Buy now
            </button>
          </div>

          {/* Lab report link */}
          {product.labReportUrl && (
            <a
              href={product.labReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-forest font-medium hover:underline mb-8"
            >
              <FileCheck size={16} /> Download lab test report
            </a>
          )}

          {/* Description */}
          <div className="border-t border-ink/10 pt-6">
            <h2 className="font-medium text-ink mb-3">About this product</h2>
            <p className="text-ink/60 leading-relaxed text-sm">{product.description}</p>
          </div>

          {/* Certifications */}
          {product.certifications.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.certifications.map((c) => (
                <span
                  key={c}
                  className="text-xs text-ink/50 border border-ink/10 px-2 py-1 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
