"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image, { StaticImageData } from "next/image";
import { useState, useTransition } from "react";
import { Star, FileCheck, ShoppingBag, Minus, Plus } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { api } from "@/lib/api";
import { useCartStore, type CartLine } from "@/store/useCartStore";
import type { Product } from "@/types/product";

export default function ProductDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get<{ data: Product }>(`/products/${slug}`)).data.data,
  });

  if (isLoading || !data) {
    return (
      <>
        <main className="max-w-7xl mx-auto px-6 py-20 text-ink/40">Loading product…</main>
      </>
    );
  }

  const product = data;

  const cartQuantity = getItemQuantity(product.id);

  const handleAddToCart = () => {
    startTransition(() => {
      addItem(
        {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: Number(product.price),
          image: product.images[0] ?? "",
        },
        1
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    });
  };

  const handleBuyNow = () => {
    startTransition(() => {
      addItem({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: Number(product.price),
        image: product.images[0] ?? "",
      });
    });
  }

  return (
    <>
      <CartDrawer />

      <main className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl bg-ink/5 relative overflow-hidden mb-4">
            {product.images[activeImage] && (
              <Image
                src={product.images[activeImage]}
                alt={product.title}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={img}
                onClick={() => setActiveImage(i)}
                className={`h-16 w-16 rounded-lg overflow-hidden border-2 relative ${
                  i === activeImage ? "border-leaf" : "border-transparent"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="font-display text-3xl text-ink mb-2">{product.title}</h1>

          {product.reviewCount ? (
            <div className="flex items-center gap-1 mb-4 text-sm text-ink/60">
              <Star size={14} className="fill-gold text-gold" />
              {product.avgRating?.toFixed(1)} · {product.reviewCount} reviews
            </div>
          ) : null}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-semibold text-ink">₹{Number(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-ink/40 line-through">₹{Number(product.compareAtPrice)}</span>
            )}
          </div>

          <p className="text-ink/60 leading-relaxed mb-6">{product.shortDescription}</p>

          <div className="flex flex-wrap gap-2 mb-8">
            {product.badges.map((b) => (
              <span
                key={b}
                className="text-xs font-medium bg-leaf/10 text-leaf px-3 py-1.5 rounded-full"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {cartQuantity > 0 ? (
              <div className="flex items-center justify-center border-2 border-leaf rounded-xl">
                <button
                  onClick={() => updateQuantity(product.id, cartQuantity - 1)}
                  className="p-3.5 text-leaf"
                >
                  <Minus size={18} />
                </button>
                <span className="px-4 font-medium">{cartQuantity} in cart</span>
                <button
                  onClick={() => updateQuantity(product.id, cartQuantity + 1)}
                  className="p-3.5 text-leaf"
                >
                  <Plus size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isPending || added}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-leaf text-leaf font-medium py-3.5 hover:bg-leaf/5 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <ShoppingBag size={18} /> {isPending ? "Adding..." : added ? "Added!" : "Add to cart"}
              </button>
            )}
            <button className="flex-1 rounded-xl bg-leaf text-white font-medium py-3.5 hover:opacity-90 transition-opacity">Buy now</button>
          </div>

          {product.labReportUrl && (
            <a
              href={product.labReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-forest font-medium hover:underline mb-8"
            >
              <FileCheck size={16} /> Download lab test report
            </a>
          )}

          <div className="border-t border-ink/10 pt-6">
            <h2 className="font-medium text-ink mb-3">About this product</h2>
            <p className="text-ink/60 leading-relaxed text-sm">{product.description}</p>
          </div>
        </div>
      </main>
    </>
  );
}
