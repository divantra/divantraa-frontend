import { getImageUrl } from "@/lib/image.utils";

export interface HeroSlide {
  /** Small uppercase eyebrow/badge text above title, e.g. "DIVANTRAA" */
  tag?: string;
  /** Main slide or banner heading */
  title?: string;
  /** Explanatory description below the title */
  subtitle?: string;
  /** Call-to-action button label */
  cta?: string;
  /** Call-to-action link destination */
  href?: string;
  /** Background image path or full URL */
  image: string;
  /** Optional custom height class override for this specific slide */
  heightClassName?: string;
}

/**
 * 1. MAIN HOMEPAGE SLIDES
 * Contains multiple slides -> renders as an interactive auto-sliding hero carousel.
 */
export const HOME_SLIDES: HeroSlide[] = [
  {
    tag: "DIVANTRAA",
    title: "Pure. Traditional. Divantraa.",
    subtitle:
      "Bringing authentic, traditionally crafted foods from our roots to your home.",
    cta: "All Products",
    href: "/products",
    image: getImageUrl("public/slider/divantar_slider_1.jpg"),
  },
  {
    tag: "DIVANTRAA",
    title: "Pure Forest Honey, Untouched & Raw",
    subtitle:
      "Ethically harvested from natural honeycombs, raw and unprocessed from forest canopies.",
    cta: "Shop Honey",
    href: "/products?category=raw-honey",
    image: getImageUrl("public/slider/divantar_slider_2.jpg"),
  },
  {
    tag: "DIVANTRAA",
    title: "Goodness, made the traditional way",
    subtitle:
      "Thoughtfully crafted with time-honoured methods and quality ingredients.",
    cta: "Shop Oils",
    href: "/products?category=wood-pressed-oils",
    image: getImageUrl("public/slider/divantar_slider_3.jpg"),
  },
  {
    tag: "DIVANTRAA",
    title: "Pure Wood-Pressed Groundnut Oil",
    subtitle:
      "Crafted from native farm groundnuts using traditional Mara Chekku wooden cold-press.",
    cta: "Shop Groundnut Oil",
    href: "/products?category=groundnut-oil",
    image: getImageUrl("public/slider/divantar_slider_5.jpg"),
  },
  {
    tag: "DIVANTRAA",
    title: "Kachi Ghani Raw Mustard Oil",
    subtitle:
      "Cold-pressed from blooming mustard seeds with authentic pungent heritage goodness.",
    cta: "Shop Mustard Oil",
    href: "/products?category=mustard-oil",
    image: getImageUrl("public/slider/divantar_slider_6.jpg"),
  },
];

/**
 * 2. CATEGORY-SPECIFIC SLIDERS & BANNERS (Active when visiting /products?category=...)
 * - 1 slide: Automatically behaves as a static Hero Banner (no arrows, no cycling timer).
 * - 2+ slides: Automatically behaves as an interactive Carousel / Slider with arrows and auto-rotation!
 */
export const CATEGORY_HERO_CONFIG: Record<string, HeroSlide[]> = {
  // Spices (/products?category=spices)
  spices: [
    {
      tag: "HERITAGE SPICES",
      title: "Heritage Spices & Ayurvedic Wellness",
      subtitle:
        "Single-origin turmeric, potent botanicals, and time-tested natural vitality directly from native farms.",
      cta: "Shop Spices",
      href: "/products?category=spices",
      image: getImageUrl("public/slider/divantar_slider_4.jpg"),
    },
    // Tip: Add a 2nd slide here anytime to make /products?category=spices a multi-slide slider!
  ],

  // Honey (/products?category=raw-wild-forest-honey or /products?category=raw-honey)
  "raw-honey": [
    {
      tag: "100% RAW & UNPROCESSED",
      title: "Wild Forest Honey",
      subtitle:
        "Ethically harvested from pristine forest canopies, untouched, unheated, and rich in natural active enzymes.",
      cta: "Explore Honey",
      href: "/products?category=raw-wild-forest-honey",
      image: getImageUrl("public/slider/divantar_slider_2.jpg"),
    },
  ],
  "raw-wild-forest-honey": [
    {
      tag: "100% RAW & UNPROCESSED",
      title: "Wild Forest Honey",
      subtitle:
        "Ethically harvested from pristine forest canopies, untouched, unheated, and rich in natural active enzymes.",
      cta: "Explore Honey",
      href: "/products?category=raw-wild-forest-honey",
      image: getImageUrl("public/slider/divantar_slider_2.jpg"),
    },
  ],

  // Wood Pressed Oils (/products?category=wood-pressed-oils)
  "wood-pressed-oils": [
    {
      tag: "COLD-PRESSED TRADITION",
      title: "Wood-Pressed Virgin Oils",
      subtitle:
        "Slow-crushed at room temperature using heritage Mara Chekku wooden presses to preserve nutrients and genuine aroma.",
      cta: "Explore Oils",
      href: "/products?category=wood-pressed-oils",
      image: getImageUrl("public/slider/divantar_slider_3.jpg"),
    },
  ],

  // Groundnut Oil (/products?category=groundnut-oil)
  "groundnut-oil": [
    {
      tag: "MARA CHEKKU COLD-PRESS",
      title: "Pure Wood-Pressed Groundnut Oil",
      subtitle:
        "Crafted from native sun-dried farm groundnuts with zero heat, solvents, or chemicals.",
      cta: "Shop Groundnut Oil",
      href: "/products?category=groundnut-oil",
      image: getImageUrl("public/slider/divantar_slider_5.jpg"),
    },
  ],

  // Mustard Oil (/products?category=mustard-oil)
  "mustard-oil": [
    {
      tag: "AUTHENTIC KACHI GHANI",
      title: "Raw Mustard Oil",
      subtitle:
        "Cold-pressed from prime mustard seeds with authentic heritage pungency and rich golden purity.",
      cta: "Shop Mustard Oil",
      href: "/products?category=mustard-oil",
      image: getImageUrl("public/slider/divantar_slider_6.jpg"),
    },
  ],

  // Wellness (/products?category=wellness)
  wellness: [
    {
      tag: "AYURVEDIC VITALITY",
      title: "Heritage Spices & Wellness",
      subtitle:
        "Single-origin turmeric, potent botanicals, and time-tested natural vitality for your daily well-being.",
      cta: "Explore Wellness",
      href: "/products?category=wellness",
      image: getImageUrl("public/slider/divantar_slider_4.jpg"),
    },
  ],
};

/**
 * 3. ROUTE-BASED BANNERS & SLIDERS
 * - When an entry has 1 slide: Automatically behaves as a static Hero Banner (no arrows, no timers).
 * - When an entry has multiple slides: Automatically behaves as an interactive Hero Carousel.
 * - Routes not listed here (e.g. /cart, /checkout, /account) will return null and show NO hero.
 */
export const ROUTE_HERO_CONFIG: Record<string, HeroSlide[] | null> = {
  // Main Homepage: Full multi-slide carousel
  "/": HOME_SLIDES,

  // All Products / Shop: Dedicated single hero banner
  "/products": [
    {
      tag: "ALL PRODUCTS",
      title: "Pure & Traditional Foods",
      subtitle:
        "Traceable, unadulterated cold-pressed oils, wild raw honey, and wholesome farm essentials.",
      image: getImageUrl("public/slider/divantar_slider_1.jpg"),
    },
  ],

  // About Us Page: Heritage banner
  "/about": [
    {
      // tag: "About Divantraa",
      title: "Pure. Sustainable. Handcrafted wellness rooted in nature.",
      // subtitle:
      //   "Pure. Sustainable. Handcrafted wellness rooted in nature.\.",
      image: getImageUrl("public/slider/divantar_slider_1.jpg"),
    },
  ],

  // Contact Us Page: Contact banner
  "/contact": [
    {
      tag: "GET IN TOUCH",
      title: "We'd Love to Hear From You",
      subtitle:
        "Have a question about our traditional products or need help with your order? Reach out anytime.",
      image: getImageUrl("public/slider/divantar_slider_2.jpg"),
    },
  ],

  // ── Explicitly Disabled Pages (NO banner or slider) ─────────────────
  // You can set any route to `null` here, or add it to DISABLED_HERO_PATHS below
  // to completely remove the slider/banner from that page.
  "/policies/privacy": null,
  "/policies/terms": null,
  "/policies/refund": null,
  "/policies/shipping": null,
};

/**
 * Routes where the hero banner or slider must NEVER appear.
 * Any route starting with or matching these paths will have NO banner.
 *
 * Example: Adding "/policies" disables all policy sub-pages (/policies/privacy, etc.)
 */
export const DISABLED_HERO_PATHS: string[] = [
  "/contact",
  "/policies",         // Disables all policy pages (/policies/privacy, /policies/terms, etc.)
  "/cart",
  "/checkout",
  "/account",
  "/login",
  "/track-order",
  "/order-confirmation",
  "/payment",
];

/**
 * Resolves the hero slides or banner for a given route and optional category.
 * Returns null if the page should not display any hero banner or carousel.
 */
export function getHeroSlidesForPath(
  pathname: string,
  category?: string | null
): HeroSlide[] | null {
  if (!pathname) return null;

  // 1. Check if the current route is in the disabled list
  const isExcluded = DISABLED_HERO_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isExcluded) {
    return null;
  }

  // 2. Check if explicitly disabled in ROUTE_HERO_CONFIG with null
  if (pathname in ROUTE_HERO_CONFIG && ROUTE_HERO_CONFIG[pathname] === null) {
    return null;
  }

  // 3. If on /products and category is provided, check category config first
  if (pathname === "/products" && category) {
    const catSlug = category.toLowerCase().trim();
    if (CATEGORY_HERO_CONFIG[catSlug]) {
      return CATEGORY_HERO_CONFIG[catSlug];
    }
    if (catSlug.includes("spice") && CATEGORY_HERO_CONFIG["spices"]) {
      return CATEGORY_HERO_CONFIG["spices"];
    }
    if (catSlug.includes("honey") && CATEGORY_HERO_CONFIG["raw-wild-forest-honey"]) {
      return CATEGORY_HERO_CONFIG["raw-wild-forest-honey"];
    }
    if (catSlug.includes("oil") && CATEGORY_HERO_CONFIG["wood-pressed-oils"]) {
      return CATEGORY_HERO_CONFIG["wood-pressed-oils"];
    }
  }

  // 4. Exact match in ROUTE_HERO_CONFIG
  if (ROUTE_HERO_CONFIG[pathname]) {
    return ROUTE_HERO_CONFIG[pathname];
  }

  // Explicitly return null for all other routes (/cart, /checkout, /account, /login, /products/[slug], etc.)
  return null;
}

