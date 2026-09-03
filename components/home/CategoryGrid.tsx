import Link from "next/link";
import Image from "next/image";

const categories = [
  { name: "Ghee", slug: "ghee", image: "/images/oil/sesame-oil.png" },
  { name: "Cold Pressed Oils", slug: "cold-pressed-oils", image: "/images/oil/sesame-oil.png" },
  { name: "Atta", slug: "atta", image: "/images/oil/sesame-oil.png" },
  { name: "Healthy Combo", slug: "healthy-combo", image: "/images/oil/sesame-oil.png" },
];

export function CategoryGrid() {
  return (
    <section className="bg-[#fafcfa] py-8">
      <div className="text-center justify-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#235a45] font-serif mb-4">
          Shop by category
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative w-full p-8">
          <Image
            src="/images/hero_caurosel1.jpeg"
            alt="Categories Background"
            fill
            className="object-cover"
            priority
          />

          {/* Black overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="group relative rounded-2xl overflow-hidden shadow-lg"
            >
              {/* Background image */}
              <div className="relative w-full h-80">
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/50 transition-colors"></div>

              {/* Title */}
              <span className="absolute bottom-4 left-4 font-display text-[#fff] font-serif">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
