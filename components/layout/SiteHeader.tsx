"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";

export function SiteHeader() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const { isMobileMenuOpen, toggleMobileMenu, openLoginModal } = useUiStore();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button className="md:hidden" onClick={toggleMobileMenu} aria-label="Menu">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="shrink-0">
          <img className="h-8 w-auto" src="/images/logo.png" alt="Divantraa Logo" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink/70">
            <Link href="/products?category=ghee" className="hover:text-forest">All Products</Link>
            <Link href="/products?category=cold-pressed-oils" className="hover:text-forest">Newly Launched</Link>
            <Link href="/products" className="hover:text-forest">Oils</Link>
            <Link href="/products" className="hover:text-forest">Wood Pressed Oils</Link>
            <Link href="/about" className="hover:text-forest">About Us</Link>
            <Link href="/contact" className="hover:text-forest">Contact Us</Link>
          </nav>

        <div className="flex items-center gap-5">
          <div className="h-5 w-5">
            {isClient && user ? (
              <Link href="/account" aria-label="Account">
                <User size={20} className="text-ink/70 hover:text-forest" />
              </Link>
            ) : (
              <button onClick={openLoginModal} aria-label="Sign in">
                <User size={20} className="text-ink/70 hover:text-forest" />
              </button>
            )}
          </div>
          <div className="relative">
            <button onClick={openCart} aria-label="Cart">
              <ShoppingBag size={20} className="text-ink/70 hover:text-forest" />
              {isClient && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-clay text-[10px] leading-4 text-white text-center">{itemCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
