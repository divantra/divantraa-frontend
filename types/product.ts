// ── Category ───────────────────────────────────────────────────

export interface Category {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  image:       string | null;
  parentId:    string | null;
  level:       number;        // 0 = root, 1 = sub, 2 = leaf
  sortOrder:   number;
  isActive:    boolean;
  children?:   Category[];    // populated in tree responses
}

// ── ProductVariant — the purchasable SKU ───────────────────────

export interface ProductVariant {
  id:             string;
  productId:      string;
  title:          string;                     // e.g. "500ml — Glass Bottle"
  options:        Record<string, string>;      // e.g. { Size: "500ml", Container: "Glass" }
  sku:            string;
  price:          number;                     // Decimal serialized as number
  compareAtPrice: number | null;              // strikethrough price
  stock:          number;
  lowStockAlert:  number;                     // threshold for "only N left" warning (default 5)
  trackInventory: boolean;
  images:         string[];                   // variant-specific; [] = use product.images
  resolvedImages: string[];                   // backend resolves: variant.images ?? product.images
  weight:         number | null;              // grams
  sortOrder:      number;
  isDefault:      boolean;
  isActive:       boolean;
}

// ── Product — the listing ──────────────────────────────────────

export interface Product {
  id:               string;
  title:            string;
  slug:             string;
  shortDescription: string | null;
  description:      string;
  brand:            string | null;
  tags:             string[];
  badges:           string[];
  certifications:   string[];
  labReportUrl:     string | null;
  categoryId:       string;
  category?:        Category;
  images:           string[];   // base images — fallback when variant has no images
  metaTitle:        string | null;
  metaDescription:  string | null;
  isFeatured:       boolean;
  isActive:         boolean;
  variants:         ProductVariant[];  // always present; at least one per product
  avgRating?:       number | null;    // computed by API from reviews
  reviewCount?:     number;
}

// ── Review ─────────────────────────────────────────────────────

export interface Review {
  id:                string;
  rating:            number;
  comment:           string | null;
  isVerifiedPurchase:boolean;
  createdAt:         string;
  user:              { name: string | null };
}

// ── Helpers ────────────────────────────────────────────────────

/** Returns the variant to pre-select on a product page. */
export function getDefaultVariant(product: Product): ProductVariant | undefined {
  return (
    product.variants.find((v) => v.isDefault && v.isActive) ??
    product.variants.find((v) => v.isActive)
  );
}

/**
 * Returns the best images to display for a variant.
 * Falls back to the product's base images when the variant has none.
 */
export function getVariantImages(variant: ProductVariant, product: Product): string[] {
  return variant.resolvedImages?.length > 0
    ? variant.resolvedImages
    : variant.images.length > 0
    ? variant.images
    : product.images;
}

/** Groups variants by their option keys for building a variant selector UI. */
export function groupVariantOptions(
  variants: ProductVariant[]
): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const v of variants) {
    if (!v.isActive) continue;
    for (const [key, value] of Object.entries(v.options)) {
      if (!map[key]) map[key] = new Set();
      map[key].add(value);
    }
  }
  return Object.fromEntries(
    Object.entries(map).map(([k, s]) => [k, Array.from(s)])
  );
}
