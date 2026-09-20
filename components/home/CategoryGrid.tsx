"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image.utils";
import { Category } from "@/types/product";

export function CategoryGrid() {
  const { data, isLoading } = useQuery<Category[]>({
    queryKey:  ["active-categories"],
    queryFn:   () => api.get("/categories/active").then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const categories = (data ?? [])
    .filter((c) => c.isActive && c.image)
    .slice(0, 6);

  // Hide the whole section while loading or if there's nothing to show
  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="bg-cream/40 py-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-forest mb-4">
          Shop by Category
        </h2>

        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-2xl bg-ink/10 animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && categories.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative w-full p-8">
            <Image
              src={getImageUrl("public/hero_caurosel1.jpeg")}
              alt="Categories Background"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/60" />

            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-lg z-10"
              >
                <div className="relative w-full h-80">
                  <Image
                    src={getImageUrl(c.image!)}
                    alt={c.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors" />
                <span className="absolute bottom-4 left-4 font-display text-white font-serif text-lg">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
