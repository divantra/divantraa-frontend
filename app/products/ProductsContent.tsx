"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import ProductSection from "@/components/product/ProductSection";
import WelcomeBanner from "@/components/product/WelcomeBanner";

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
      <WelcomeBanner />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 min-h-[60vh]">
        <div className="flex items-center mb-6">
          {category && (
            <h1 className="font-display text-2xl sm:text-3xl text-ink capitalize">
              {category.replace(/-/g, " ")}
            </h1>
          )}

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-ink/10 rounded-lg px-3 py-2 text-sm bg-white text-ink/70 ml-auto"
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

        <div className="space-y-6">
          {data?.map((product) => (
            <ProductSection key={product.id} product={product} />
          ))}
        </div>
      </main>
    </>
  );
}
