import Link from "next/link";

const categories = [
  { name: "Ghee", slug: "ghee" },
  { name: "Cold Pressed Oils", slug: "cold-pressed-oils" },
  { name: "Atta", slug: "atta" },
  { name: "Healthy Combo", slug: "healthy-combo" },
];

export function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <h2 className="font-display text-2xl sm:text-3xl text-ink mb-8">Shop by category</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/products?category=${c.slug}`}
            className="group relative aspect-[16/9] rounded-2xl bg-leaf/10 overflow-hidden flex items-end p-6"
          >
            <span className="font-display text-2xl text-forest group-hover:translate-x-1 transition-transform">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
