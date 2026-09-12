"use client";

import React, { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Circle, Minus, Plus } from "lucide-react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { api } from "@/lib/api";
import { useCartStore, type CartLine } from "@/store/useCartStore";
import type { Product, ProductVariant } from "@/types/product";
import { getDefaultVariant } from "@/types/product";

export default function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const [sort, setSort] = useState("newest");

  const { data, isLoading } = useQuery({
    queryKey: ["products", category, sort],
    queryFn: async () =>
      (
        await api.get<{ data: Product[] }>("/products", {
          params: { category, sort, limit: 24 },
        })
      ).data.data,
  });

  return (
    <>
      <CartDrawer />

      <main className="max-w-7xl mx-auto px-6 py-10 min-h-[60vh]">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-ink">
            {category ? category.replace(/-/g, " ") : "Shop all"}
          </h1>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-ink/10 rounded-lg px-3 py-2 text-sm bg-white text-ink/70"
          >
            <option value="newest">Newest</option>
            <option value="featured">Featured</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {isLoading && <p className="text-ink/40">Loading products…</p>}

        {!isLoading && data?.length === 0 && (
          <p className="text-ink/40">No products found in this category yet.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {data?.map((product) => {
            // Every product has ≥1 variant; use the default one for the card
            const variant = getDefaultVariant(product);
            if (!variant) return null;

            const cardImage =
              variant.resolvedImages?.[0] ?? variant.images[0] ?? product.images[0] ?? "";

            const discountPct =
              variant.compareAtPrice
                ? Math.round(
                    ((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100
                  )
                : null;

            return (
              <div
                key={product.id}
                className="group border rounded-xl bg-white shadow hover:shadow-lg transition overflow-hidden"
              >
                <Link href={`/products/${product.slug}`} className="block">
                  {/* Image with badges overlay */}
                  <div className="relative w-full h-64">
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {product.badges[0] && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-br">
                          {product.badges[0]}
                        </span>
                      )}
                      {discountPct !== null && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded">
                          {discountPct}% Off
                        </span>
                      )}
                    </div>
                    {cardImage ? (
                      <Image
                        src={cardImage}
                        alt={product.title}
                        fill
                        className="object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="w-full h-full bg-ink/5 rounded-t-xl" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-4 space-y-1">
                    <h3 className="text-sm font-semibold truncate">{product.title}</h3>
                    {/* Variant options hint (e.g. "500ml · Glass Jar") */}
                    {Object.values(variant.options).length > 0 && (
                      <p className="text-xs text-ink/40">
                        {Object.values(variant.options).join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-green-600 font-bold text-sm">₹{variant.price}</p>
                      {variant.compareAtPrice && (
                        <p className="line-through text-gray-400 text-xs">
                          ₹{variant.compareAtPrice}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{product.shortDescription}</p>
                  </div>
                </Link>

                {/* Add to cart */}
                <div className="px-4 pb-4">
                  <AddToCartButton
                    item={{
                      productId:    product.id,
                      variantId:    variant.id,
                      title:        product.title,
                      variantTitle: variant.title,
                      slug:         product.slug,
                      price:        Number(variant.price),
                      image:        cardImage,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

// ── Add-to-cart button with quantity stepper ───────────────────

function AddToCartButton({ item }: { item: Omit<CartLine, "quantity"> }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();

  const cartQuantity = getItemQuantity(item.variantId);

  const handleAdd = () => {
    setLoading(true);
    setTimeout(() => {
      addItem(item, 1);
      setLoading(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 400);
  };

  if (cartQuantity > 0) {
    return (
      <div className="flex items-center justify-center border border-leaf rounded-lg mt-2 text-xs">
        <button
          onClick={() => updateQuantity(item.variantId, cartQuantity - 1)}
          className="p-2 text-leaf"
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="px-2 font-medium">{cartQuantity}</span>
        <button
          onClick={() => updateQuantity(item.variantId, cartQuantity + 1)}
          className="p-2 text-leaf"
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="mt-2 w-full text-xs font-medium border border-leaf text-leaf rounded-lg py-2 hover:bg-leaf/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Circle className="animate-spin h-4 w-4 text-leaf" />
          <span>Adding…</span>
        </>
      ) : added ? (
        "Added! ✓"
      ) : (
        "🛒 ADD"
      )}
    </button>
  );
}
