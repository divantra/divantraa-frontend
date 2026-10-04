import type { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await api.get<{ data: Product }>(`/products/${slug}`);
    const product = res.data?.data;
    if (product?.title) {
      return {
        title: product.title,
        description: product.shortDescription || product.description,
        openGraph: {
          title: product.title,
          description: product.shortDescription || product.description,
          images: product.images?.[0] ? [{ url: product.images[0] }] : undefined,
        },
      };
    }
  } catch {
    // fallback if server fetch fails or during build
  }

  // Format slug as fallback: "a2-ghee" -> "A2 Ghee"
  const fallbackTitle = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    title: fallbackTitle,
  };
}

export default function ProductDetailsPage() {
  return <ProductDetailsClient />;
}
