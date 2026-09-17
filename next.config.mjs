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
