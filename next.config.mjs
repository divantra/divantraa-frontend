/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "divantraa.com",
        pathname: "/images/**",
      },
      // Unsplash — used for seed/placeholder product images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  /**
   * Dev-server proxy: browser calls /api/... → Next.js dev server → localhost:5000
   *
   * In production, nginx's  location /api/  intercepts the request before it
   * ever reaches Next.js, so this rewrite is a complete no-op there.
   * It only activates when running `next dev` locally (no nginx).
   */
  // Old size-specific product URLs -> merged product with variants
  async redirects() {
    return [
      { source: "/products/wood-pressed-mustard-oil-250ml", destination: "/products/wood-pressed-mustard-oil", permanent: true },
      { source: "/products/wood-pressed-mustard-oil-1l", destination: "/products/wood-pressed-mustard-oil", permanent: true },
      { source: "/products/wood-pressed-mustard-oil-500ml", destination: "/products/wood-pressed-mustard-oil", permanent: true },
      { source: "/products/wood-pressed-coconut-oil-250ml", destination: "/products/wood-pressed-coconut-oil", permanent: true },
      { source: "/products/wood-pressed-coconut-oil-500ml", destination: "/products/wood-pressed-coconut-oil", permanent: true },
      { source: "/products/wood-pressed-coconut-oil-1l", destination: "/products/wood-pressed-coconut-oil", permanent: true },
      { source: "/products/wood-pressed-groundnut-oil-500ml", destination: "/products/wood-pressed-groundnut-oil", permanent: true },
      { source: "/products/wood-pressed-groundnut-oil-1l", destination: "/products/wood-pressed-groundnut-oil", permanent: true },
      { source: "/products/wood-pressed-sesame-oil-250ml", destination: "/products/wood-pressed-sesame-oil", permanent: true },
      { source: "/products/wood-pressed-sesame-oil-500ml", destination: "/products/wood-pressed-sesame-oil", permanent: true },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "http://localhost:5000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
