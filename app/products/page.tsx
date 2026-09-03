"use client";

import React from "react";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { api } from "@/lib/api";
import { useCartStore, type CartLine } from "@/store/useCartStore";
import type { Product } from "@/types/product";
import { Circle, Minus, Plus } from "lucide-react";

export default function ProductsPage() {
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
          {data?.map((product) => (
            <div key={`product_${product.id}`} className="group border rounded-xl bg-white shadow hover:shadow-lg transition overflow-hidden">
              <Link href={`/products/${product.slug}`} className="block">
                {/* Image with badges overlay */}
                <div className="relative w-full h-64">
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {/* {product.badges && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                        {product.badges}
                      </span>
                    )} */}
                    {product.badges && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-br">
                      {product.badges}
                    </span>)}
                  
                    {product.compareAtPrice && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded">
                        {Math.round(
                          ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
                        )}% Off
                      </span>
                    )}
                  </div>
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover rounded-t-xl"
                  />
                </div>

                {/* Product Content */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold truncate">{product.title}</h3>
                    <div className="flex items-center gap-2">
                      {product.compareAtPrice && (
                        <p className="line-through text-gray-400 text-xs">
                          ₹{product.compareAtPrice}
                        </p>
                      )}
                      <p className="text-green-600 font-bold text-sm">₹{product.price}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 truncate">{product.description}</p>

                  {product.price && (
                    <p className="text-xs text-green-500">Best Price ₹{product.price}</p>
                  )}
                </div>
              </Link>

              {/* Add to Cart */}
              <div className="p-4">
                <AddToCartButton
                  product={{
                    productId: product.id,
                    title: product.title,
                    slug: product.slug,
                    price: Number(product.price),
                    image: product.images[0] ?? "",
                  }}
                />
              </div>
            </div>

          ))}
        </div>
      </main>
    </>
  );
}

function AddToCartButton({ product }: { product: Omit<CartLine, "quantity"> }) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const cartQuantity = getItemQuantity(product.productId);

  const handleClick = () => {
    // startTransition(() => {
    //   addItem(product, 1);
    //   setAdded(true);
    //   setTimeout(() => setAdded(false), 1500);
    // });
    setLoading(true); // show loader first
    setTimeout(() => {
      addItem(product, 1);
      setLoading(false);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500); // reset after 1.5s
    }, 1000);
  };

  if (cartQuantity > 0) {
    return (
      <div className="flex items-center justify-center border border-leaf rounded-lg mt-2 text-xs">
        <button
          onClick={() => updateQuantity(product.productId, cartQuantity - 1)}
          className="p-2 text-leaf"
        >
          <Minus size={14} />
        </button>
        <span className="px-2 font-medium">{cartQuantity}</span>
        <button
          onClick={() => updateQuantity(product.productId, cartQuantity + 1)}
          className="p-2 text-leaf"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-2 w-full text-xs font-medium border border-leaf text-leaf rounded-lg py-2 hover:bg-leaf/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Circle className="animate-spin h-4 w-4 text-leaf" />
          <span>Adding...</span>
        </>
      ) : added ? (
        "Added!"
      ) : (
        "🛒 ADD"
      )}
    </button>
  );
}

