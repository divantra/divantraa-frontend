import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/account", "/admin", "/checkout", "/cart", "/payment/return"] },
    ],
    sitemap: "https://divantraa.com/sitemap.xml",
  };
}
