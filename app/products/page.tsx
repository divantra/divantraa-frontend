"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import type { Product } from "@/types/product";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? undefined;
  const [sort, setSort] = useState("newest");
  const addItem = useCartStore((s) => s.addItem);

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
      <SiteHeader />
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
            <div key={product.id} className="group">
              <Link href={`/products/${product.slug}`} className="block">
                <div className="aspect-square rounded-xl bg-ink/5 relative overflow-hidden mb-3">
                  {product.images[0] && (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <p className="text-sm font-medium text-ink truncate">{product.title}</p>
                <p className="text-sm text-ink/50">₹{Number(product.price)}</p>
              </Link>
              <button
                onClick={() =>
                  addItem({
                    productId: product.id,
                    title: product.title,
                    slug: product.slug,
                    price: Number(product.price),
                    image: product.images[0] ?? "",
                  })
                }
                className="mt-2 w-full text-xs font-medium border border-leaf text-leaf rounded-lg py-2 hover:bg-leaf/5 transition-colors"
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
