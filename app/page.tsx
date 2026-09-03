import Link from "next/link";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { TrustBadges } from "@/components/home/TrustBadges";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { WhyChooseBlock } from "@/components/home/WhyChooseBlock";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <CartDrawer />

      <main>
        <TrustBadges />
        <CategoryGrid />
        <WhyChooseBlock />

        {/* Farm story block */}
        <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-clay font-medium">
              Our story
            </span>
            <h2 className="font-display text-3xl sm:text-4xl mt-3 mb-5 leading-tight text-ink">
              From our farms, to your kitchen — with nothing hidden in between.
            </h2>
            <p className="text-ink/60 leading-relaxed mb-6">
              Every batch is traceable back to the farm it came from and lab-tested before
              it reaches you. No shortcuts, no fillers — just what nature intended.
            </p>
            <Link
              href="/products"
              className="inline-block rounded-full bg-forest text-cream px-6 py-3 text-sm font-medium hover:opacity-90"
            >
              Shop all products
            </Link>
          </div>
          {/* <div className="aspect-[4/3] rounded-2xl bg-leaf/10" /> */}
          <div className="aspect-[4/3] rounded-2xl overflow-hidden relative">
            <Image
              src="/images/hero_caurosel1.jpeg"
              alt="Divantraa"
              fill
              className="object-cover"
            />
          </div>
        </section>
      </main>
    </>
  );
}
