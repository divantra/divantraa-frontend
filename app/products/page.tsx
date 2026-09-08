import { Suspense } from "react";
import ProductsContent from "./ProductsContent";

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
