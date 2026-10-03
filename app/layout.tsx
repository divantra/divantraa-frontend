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
import { AddOnsDrawer } from "@/components/cart/AddOnsDrawer";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";
import { WhatsAppWidget } from "@/components/layout/WhatsAppWidget";

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

const SITE_URL = "https://divantraa.com";
const SITE_NAME = "Divantraa";
const DESCRIPTION = "A2 ghee, wood cold-pressed oils and lab-tested farm essentials.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Farm to Home`, template: `%s — ${SITE_NAME}` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — Farm to Home`,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: SITE_NAME }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Farm to Home`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

/** Organization schema: what makes the mark eligible to show next to the site in Google search results. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-mark.png`,
  description: DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${robotoSlab.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>
          <div className="sticky top-0 z-50">
            <PromoBar />
            <Suspense fallback={<div className="h-[108px] bg-white shadow-sm" />}>
              <SiteHeader />
            </Suspense>
          </div>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <CartDrawer />
          <AddOnsDrawer />
          <LoginModal />
          <SiteFooter />
          <WhatsAppWidget />
        </Providers>
      </body>
    </html>
  );
}
