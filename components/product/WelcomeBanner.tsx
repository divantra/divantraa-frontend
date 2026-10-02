import { Leaf } from "lucide-react";

/** Brand welcome message shown below the hero carousel on the all-products page. */
export default function WelcomeBanner() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-center sm:py-12">
      <h2 className="font-display text-2xl text-ink sm:text-3xl">Welcome to Divantraa</h2>

      <div className="mx-auto mt-3 flex max-w-xs items-center gap-2">
        <span className="h-px flex-1 bg-forest/30" />
        <Leaf size={14} strokeWidth={2} className="shrink-0 text-forest/70" />
        <span className="h-px flex-1 bg-forest/30" />
      </div>

      <p className="mt-3 font-display italic text-lg text-forest">
        Pure Beginnings. Healthy Living.
      </p>

      <p className="mt-4 text-sm text-ink/60 sm:text-base">
        We bring you traditionally crafted spices, wood-pressed oils and raw forest honey —
        made the way nature intended, and delivered straight to your home.
      </p>
    </div>
  );
}
