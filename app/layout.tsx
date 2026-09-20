// app/layout.tsx (server)
import type { Metadata } from "next";
import { Figtree, Roboto_Slab } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { PromoBar } from "@/components/layout/PromoBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LoginModal } from "@/components/auth/LoginModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Divantraa — Farm to Home",
  description: "A2 ghee, wood cold-pressed oils and lab-tested farm essentials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${robotoSlab.variable}`}>
      <body>
        <Providers>
          <PromoBar />
          <Suspense fallback={<div className="sticky top-0 z-50 h-[108px] bg-white shadow-sm" />}>
            <SiteHeader />
          </Suspense>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <CartDrawer />
          <LoginModal />
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
