export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  badges: string[];
  labReportUrl?: string | null;
  certifications: string[];
  categoryId: string;
  category?: Category;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  isFeatured: boolean;
  avgRating?: number;
  reviewCount?: number;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: { name: string | null };
}
