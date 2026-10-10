"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Star, FileCheck, ShoppingBag, Minus, Plus, Package, ChevronDown, Coins } from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { usePromoConfig, bestPrice, coinsEarned } from "@/hooks/usePromoConfig";
import type { Product } from "@/types/product";
import {
  getDefaultVariant,
  getVariantImages,
  getDiscountPercent,
  getUnitPriceLabel,
} from "@/types/product";
import { ProductTrustBadges } from "@/components/product/ProductTrustBadges";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductShippingNotice } from "@/components/product/ProductShippingNotice";

export default function ProductDetailsClient() {
  const { slug } = useParams<{ slug: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, updateQuantity, getItemQuantity, openCart } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { data: promo } = usePromoConfig();

  // Variant selector — the id chosen in the "Select Variant" dropdown
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get<{ data: Product }>(`/products/${slug}`)).data.data,
    // After data loads, initialise selected options from the default variant
    select: (product) => {
      return product;
    },
  });

  const product = data;

  useEffect(() => {
    if (product?.title) {
      document.title = `${product.title} - Divantraa`;
    }
  }, [product?.title]);

  const activeVariant = product
    ? product.variants.find((v) => v.id === selectedVariantId && v.isActive) ??
      getDefaultVariant(product)
    : undefined;

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

  // Auto-advance the gallery every 10s — pauses itself whenever there's only one image to show.
  const imageCount = displayImages.length;
  useEffect(() => {
    if (imageCount <= 1) return;
    const timer = setInterval(() => setActiveImage((i) => (i + 1) % imageCount), 10_000);
    return () => clearInterval(timer);
  }, [imageCount, activeVariant?.id]);

  const cartQuantity = activeVariant ? getItemQuantity(activeVariant.id) : 0;

  // ── Cart actions ──────────────────────────────────────────────

  function syncAddToServer(variantId: string, qty: number) {
    if (!user) return;
    api.post("/cart/items", { variantId, quantity: qty }).catch(() => {});
  }

  const handleAddToCart = () => {
    if (!product || !activeVariant) return;
    startTransition(() => {
      const ok = addItem(
        {
          productId:    product.id,
          variantId:    activeVariant.id,
          title:        product.title,
          variantTitle: activeVariant.title,
          slug:         product.slug,
          price:        Number(activeVariant.price),
          image:        displayImages[0] ?? "",
        },
        quantity
      );
      if (!ok) return; // not signed in — addItem already opened the login modal
      syncAddToServer(activeVariant.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  };

  const handleBuyNow = () => {
    if (!product || !activeVariant) return;
    startTransition(() => {
      const ok = addItem(
        {
          productId:    product.id,
          variantId:    activeVariant.id,
          title:        product.title,
          variantTitle: activeVariant.title,
          slug:         product.slug,
          price:        Number(activeVariant.price),
          image:        displayImages[0] ?? "",
        },
        quantity
      );
      if (!ok) return; // not signed in — addItem already opened the login modal
      syncAddToServer(activeVariant.id, quantity);
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
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 text-xs text-ink/50">
        <Link href="/products" className="hover:text-forest">All products</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">{product.title}</span>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-2 gap-8 lg:gap-14">

        {/* ── Image gallery slider (Anveshan style) ──────────────── */}
        <ProductImageGallery
          images={displayImages}
          title={product.title}
          badge={product.badges?.[0]}
          activeImage={activeImage}
          onSelectImage={setActiveImage}
        />

        {/* ── Product info ──────────────────────────────────── */}
        <div>
          <h2 className="font-display text-1xl lg:text-2xl text-ink mb-3">{product.title}</h2>

          {/* Rating */}
          {!!product.reviewCount && (
            <div className="flex items-center gap-1 mb-4 text-sm text-ink/60">
              <Star size={14} className="fill-gold text-gold" />
              {product.avgRating?.toFixed(1)} · {product.reviewCount} review
              {product.reviewCount !== 1 ? "s" : ""}
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            {activeVariant ? (
              <>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl font-semibold text-ink">
                    ₹{Number(activeVariant.price).toLocaleString("en-IN")}
                  </span>
                  {getDiscountPercent(activeVariant) > 0 && (
                    <>
                      <span className="text-ink/40 line-through text-base">
                        ₹{Number(activeVariant.compareAtPrice).toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        {getDiscountPercent(activeVariant)}% off
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs font-medium text-ink/70 mt-2">
                  Size: <span className="text-ink">{activeVariant.title}</span>
                </p>
                <p className="text-xs text-ink/40 mt-1">Inclusive of all taxes</p>
              </>
            ) : (
              <span className="text-sm text-ink/40">Select a variant</span>
            )}
          </div>

          {/* Short description */}
          <p className="text-ink/60 leading-relaxed mb-2">{product.shortDescription}</p>

          {/* Earn Divantraa Coins + best price with the standing promo code — for the selected variant, live-refreshing as it changes */}
          {activeVariant && (
            <div className="mb-5 space-y-2.5">
              {!!promo?.coinEarnRate && (
                <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 px-4 py-3">
                  <Coins size={18} className="text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-900">
                    Buy now &amp; earn <span className="font-bold">{coinsEarned(Number(activeVariant.price), promo)} Divantraa Coins</span> instantly
                  </p>
                </div>
              )}
              {bestPrice(Number(activeVariant.price), promo) !== null && (
                <div className="animate-pulse-glow flex items-center justify-between rounded-xl bg-forest px-4 py-3.5">
                  <p className="text-sm text-white">
                    Best Price <span className="text-lg font-bold">₹{bestPrice(Number(activeVariant.price), promo)!.toLocaleString("en-IN")}</span>
                  </p>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">with {promo!.promoCode}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Variant selector (cards) ───────────────────── */}
          {product.variants.length > 1 && (
            <div className="mb-5">
              <p id="variant-label" className="text-sm font-medium text-ink/70 mb-3">Select Variant</p>
              <div role="radiogroup" aria-labelledby="variant-label" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...product.variants].sort((a, b) => a.sortOrder - b.sortOrder).map((v) => {
                  const off = getDiscountPercent(v);
                  const unit = getUnitPriceLabel(v);
                  const soldOut = v.trackInventory && v.stock === 0;
                  const selected = activeVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={soldOut}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`overflow-hidden rounded-xl border text-left transition-all ${
                        selected
                          ? "border-forest ring-1 ring-forest shadow-sm"
                          : soldOut
                          ? "border-ink/10 opacity-50 cursor-not-allowed"
                          : "border-ink/15 hover:border-forest/50"
                      }`}
                    >
                      <span
                        className={`block px-2 py-1 text-center text-sm font-medium ${
                          selected ? "bg-forest text-white" : "bg-ink/5 text-ink/80"
                        }`}
                      >
                        {v.title}
                      </span>
                      <span className="block bg-white px-2 py-2">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-base font-bold text-ink">
                            ₹{Number(v.price).toLocaleString("en-IN")}
                          </span>
                          {off > 0 && (
                            <>
                              <span className="text-xs text-ink/40 line-through">
                                ₹{Number(v.compareAtPrice).toLocaleString("en-IN")}
                              </span>
                              <span className="text-xs font-medium text-red-500">{off}% off</span>
                            </>
                          )}
                        </span>
                        {unit && <span className="mt-1 block text-xs text-leaf">{unit}</span>}
                        {soldOut && <span className="mt-1 block text-xs text-red-500">Out of stock</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* Cart actions — [ - 1 + ] [ Add to cart ] [ Buy Now ] */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 w-full">
            {/* Quantity Selector */}
            <div className="flex items-center bg-[#F6F7F6] rounded-xl h-12 w-28 sm:w-32 shrink-0 border border-ink/10">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || !inStock}
                className="w-9 sm:w-10 h-full flex items-center justify-center text-ink/70 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-medium select-none"
                aria-label="Decrease quantity"
              >
                –
              </button>
              <span className="flex-1 text-center font-medium text-ink text-sm sm:text-base select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(activeVariant?.stock ?? 99, q + 1))}
                disabled={!inStock || quantity >= (activeVariant?.stock ?? 99)}
                className="w-9 sm:w-10 h-full flex items-center justify-center text-ink/70 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg font-medium select-none"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={isPending || !inStock || !activeVariant}
              className="flex-1 h-12 rounded-full bg-[#00584B] hover:bg-[#00483D] active:scale-[0.98] text-white font-medium text-sm sm:text-base px-3 sm:px-6 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
            >
              {isPending ? "Adding…" : added ? "Added! ✓" : "Add to cart"}
            </button>

            {/* Buy Now button */}
            <button
              onClick={handleBuyNow}
              disabled={!inStock || !activeVariant}
              className="flex-1 h-12 rounded-full bg-[#EFC902] hover:bg-[#E2BD00] active:scale-[0.98] text-[#00584B] font-medium text-sm sm:text-base px-3 sm:px-6 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
            >
              Buy Now
            </button>
          </div>

          {/* In-cart indicator if already added */}
          {cartQuantity > 0 && (
            <p className="text-xs text-forest font-medium -mt-4 mb-5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest inline-block" />
              {cartQuantity} already in your cart
            </p>
          )}

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
            <h3 className="text-ink font-bold mb-2">Product Description</h3>
            <p className="text-ink/60 leading-relaxed text-sm">{product.description}</p>
          </div>

          {/* Trust & Guarantee Badges (Right side only) */}
          <ProductTrustBadges freeShippingThreshold={499} layout="compact" />

          {/* Free shipping & Delivery estimation area */}
          {/* <ProductShippingNotice freeShippingThreshold={499} /> */}

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

      {/* ── Details: uses, benefits, FAQ (full width below the fold) ── */}
      {(product.shelfLife || product.uses?.length > 0 || product.benefits?.length > 0 || product.faqs?.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="border-t border-ink/10 pt-10 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-10">
              {product.benefits?.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-ink mb-5">Why you'll love it</h2>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {product.benefits.map((b, i) => (
                      <div key={b.title} className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
                        <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-leaf/10 text-sm font-semibold text-leaf">
                          {i + 1}
                        </span>
                        <p className="font-medium text-ink">{b.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink/60">{b.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.faqs?.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-ink mb-5">Frequently asked questions</h2>
                  <div className="divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white">
                    {product.faqs.map((f, i) => (
                      <div key={f.question}>
                        <button
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          aria-expanded={openFaq === i}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-ink"
                        >
                          {f.question}
                          <ChevronDown size={16} className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                        </button>
                        {openFaq === i && <p className="px-5 pb-5 text-sm leading-relaxed text-ink/60">{f.answer}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-6 self-start rounded-2xl bg-leaf/5 p-6">
              {product.shelfLife && (
                <div>
                  <h3 className="text-sm font-medium text-ink mb-1">Shelf life</h3>
                  <p className="text-sm text-ink/60">{product.shelfLife}</p>
                </div>
              )}
              {product.uses?.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-ink mb-2">Best used for</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.uses.map((u) => (
                      <span key={u} className="rounded-full bg-white px-3 py-1 text-xs text-ink/70 border border-ink/10">{u}</span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      )}
    </>
  );
}
