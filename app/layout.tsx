// app/layout.tsx (server)
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { PromoBar } from "@/components/layout/PromoBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LoginModal } from "@/components/auth/LoginModal";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "Divantraa — Farm to Home",
  description: "A2 ghee, wood cold-pressed oils and lab-tested farm essentials.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PromoBar />
          <SiteHeader />
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          <LoginModal />
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
