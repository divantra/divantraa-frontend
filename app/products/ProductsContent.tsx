"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Circle, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useCartStore, type CartLine } from "@/store/useCartStore";
import type { Product } from "@/types/product";
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-[60vh]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink">
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:gap-4">
        {data?.map((product) => {
          const variant = getDefaultVariant(product);
          if (!variant) return null;

          const cardImage =
            variant.resolvedImages?.[0] ??
            variant.images?.[0] ??
            product.images?.[0] ??
            "";

          const badge = product.badges?.[0];

          return (
            <div
  key={product.id}
  className="
    group
    relative
    flex
    min-w-0
    flex-col
    overflow-hidden
    rounded-[16px]
    border
    border-gray-200
    bg-white
    shadow-sm
    transition-all
    duration-200
    hover:-translate-y-0.5
    hover:shadow-md
  "
>
  {/* =====================================================
      BADGE
  ====================================================== */}

  {badge && (
    <div
      className="
        absolute
        right-0
        top-0
        z-30
        flex
        max-w-[75%]
        items-center
        gap-1.5
        rounded-bl-[16px]
        bg-[#D99A18]
        px-3
        py-2.5
        text-white
      "
    >
      <Star
        size={16}
        fill="currentColor"
        strokeWidth={1.5}
      />

      <span
        className="
          truncate
          text-[11px]
          font-bold
          sm:text-xs
        "
      >
        {badge}
      </span>
    </div>
  )}

  {/* =====================================================
      PRODUCT IMAGE
  ====================================================== */}

  <Link
    href={`/products/${product.slug}`}
    className="block w-full"
  >
    <div
      className="
        relative
        flex
        h-[210px]
        w-full
        items-center
        justify-center
        overflow-hidden
        bg-white

        sm:h-[220px]

        md:h-[225px]

        lg:h-[230px]
      "
    >
      {cardImage ? (
        <Image
          src={cardImage}
          alt={product.title}
          fill
          sizes="
            (max-width: 640px) 50vw,
            (max-width: 1024px) 33vw,
            25vw
          "
          className="
            object-cover
            p-1
            transition-transform
            duration-300
            group-hover:scale-[1.03]
          "
        />
      ) : (
        <div
          className="
            flex
            h-full
            w-full
            items-center
            justify-center
            text-xs
            text-gray-300
          "
        >
          No image
        </div>
      )}
    </div>
  </Link>

  {/* =====================================================
      FLOATING ADD BUTTON
  ====================================================== */}

  <div
    className="
      absolute
      right-3
      top-[40%]
      z-40
    "
  >
    <AddToCartButton
      item={{
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        variantTitle: variant.title,
        slug: product.slug,
        price: Number(variant.price),
        image: cardImage,
      }}
    />
  </div>

  {/* =====================================================
      PRODUCT DETAILS
  ====================================================== */}

  <div
    className="
      flex
      flex-1
      flex-col
      px-3.5
      pb-3.5
      pt-2.5
    "
  >
    <Link
      href={`/products/${product.slug}`}
    >
      {/* TITLE */}

      <h3
        className="
          min-h-[40px]
          pr-10
          text-[15px]
          font-semibold
          leading-[1.3]
          text-gray-900

          sm:text-[16px]
        "
      >
        {product.title}
      </h3>

      {/* VARIANT OPTIONS */}

      {Object.values(
        variant.options
      ).length > 0 && (
        <p
          className="
            mt-1
            truncate
            text-[11px]
            text-gray-400
          "
        >
          {Object.values(
            variant.options
          ).join(" · ")}
        </p>
      )}

      {/* RATING */}

      <div
        className="
          mt-2.5
          flex
          items-center
          gap-1.5
        "
      >
        <Star
          size={15}
          fill="#FFB000"
          className="
            shrink-0
            text-[#FFB000]
          "
          strokeWidth={1.5}
        />

        <span
          className="
            text-[12px]
            font-semibold
            text-gray-900
          "
        >
          4.8
        </span>

        <span
          className="
            truncate
            text-[11px]
            text-gray-500
          "
        >
          (1275 reviews)
        </span>
      </div>

      {/* PRICE */}

      <div
        className="
          mt-2
          flex
          items-baseline
          gap-2
        "
      >
        <span
          className="
            text-[21px]
            font-bold
            leading-none
            text-gray-900
          "
        >
          ₹{variant.price}
        </span>

        {variant.compareAtPrice && (
          <span
            className="
              text-[12px]
              text-gray-400
              line-through
            "
          >
            ₹{variant.compareAtPrice}
          </span>
        )}
      </div>

      {/* BEST PRICE OFFER */}

      <div
        className="
          mt-2.5
          flex
          min-h-[32px]
          items-center
          gap-1
          rounded-lg
          bg-[#EAF4E9]
          px-2
          py-1.5
        "
      >
        <span className="text-[11px]">
          🏷️
        </span>

        <span
          className="
            text-[10px]
            font-bold
            text-[#16806F]

            sm:text-[11px]
          "
        >
          Best Price
        </span>

        <span
          className="
            text-[10px]
            font-semibold
            text-[#16806F]

            sm:text-[11px]
          "
        >
          ₹
          {Math.round(
            Number(variant.price) *
              0.85
          )}
        </span>

        <span
          className="
            hidden
            text-[10px]
            text-[#16806F]

            sm:inline
          "
        >
          with PURE15
        </span>
      </div>
    </Link>
  </div>
</div>
          );
        })}
      </div>
    </main>
  );
}

/* ── ADD TO CART — identical logic & style to CategoryProductSlider ── */

function AddToCartButton({ item }: { item: Omit<CartLine, "quantity"> }) {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [added, setAdded]       = useState(false);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();

  useEffect(() => { setIsClient(true); }, []);

  const cartQuantity = isClient ? getItemQuantity(item.variantId) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setTimeout(() => {
      addItem(item, 1);
      setLoading(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }, 350);
  };

  if (cartQuantity > 0) {
    return (
      <div className="
        flex h-[40px] min-w-[88px] items-center justify-between
        overflow-hidden rounded-[20px] bg-[#205F4E] shadow-md
      ">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateQuantity(item.variantId, cartQuantity - 1);
          }}
          className="flex h-full w-7 items-center justify-center text-white hover:bg-white/10"
          aria-label="Decrease quantity"
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <span className="text-xs font-bold text-white">{cartQuantity}</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateQuantity(item.variantId, cartQuantity + 1);
          }}
          className="flex h-full w-7 items-center justify-center text-white hover:bg-white/10"
          aria-label="Increase quantity"
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="
        flex h-[40px] min-w-[88px] items-center justify-center gap-1.5
        rounded-[20px] bg-[#205F4E] px-3.5
        text-xs font-semibold text-white shadow-md
        transition-all duration-200
        hover:bg-[#184D3F] hover:shadow-lg
        active:scale-95
        disabled:cursor-not-allowed disabled:opacity-60
      "
    >
      {loading ? (
        <Circle className="h-4 w-4 animate-spin text-white" />
      ) : added ? (
        <span>✓ Added</span>
      ) : (
        <>
          <span>ADD</span>
          <ShoppingCart size={17} strokeWidth={2} />
        </>
      )}
    </button>
  );
}
