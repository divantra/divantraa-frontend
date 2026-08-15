import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import { PromoBar } from "@/components/layout/PromoBar";
import { LoginModal } from "@/components/auth/LoginModal";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";

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
          {children}
          <LoginModal />
        </Providers>
      </body>
    </html>
  );
}
