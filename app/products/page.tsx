import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsContent from "./ProductsContent";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse our farm-fresh A2 ghee, wood cold-pressed oils, and lab-tested organic essentials.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsLoading() {
  return (
    <main className="max-w-7xl mx-auto px-6 py-10 min-h-[60vh]">
      <p className="text-ink/40">Loading products…</p>
    </main>
  );
}
