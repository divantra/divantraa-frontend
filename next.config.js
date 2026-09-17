/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "divantraa.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;