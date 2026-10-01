import type { MetadataRoute } from "next";

const SITE_URL = "https://divantraa.com";
// Server-side (build time): hit the backend directly, same convention as lib/api.ts.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";
const PAGE_SIZE = 50; // the backend's own cap (product.controller.ts: limit.max(50))

interface ProductSlug { slug: string; updatedAt?: string }

/** Walks every page of /products (capped at 50/page server-side) to list every slug. */
async function fetchProductSlugs(): Promise<ProductSlug[]> {
  const all: ProductSlug[] = [];
  try {
    for (let page = 1; page <= 20; page++) { // hard stop at 1000 products — plenty of headroom, never an infinite loop
      const res = await fetch(`${API_URL}/products?limit=${PAGE_SIZE}&page=${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const json = await res.json();
      const batch = (json.data ?? []) as { slug: string; updatedAt?: string }[];
      if (batch.length === 0) break;
      all.push(...batch.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })));
      if (batch.length < PAGE_SIZE) break; // last page
    }
  } catch {
    // sitemap must never fail the build over a transient API issue — return whatever we already have
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProductSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/policies/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policies/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policies/shipping`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/policies/refund`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
