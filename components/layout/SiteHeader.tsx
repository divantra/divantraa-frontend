"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCart, CircleUser, Menu, X, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import { useDebounce } from "@/hooks/useDebounce";

export function SiteHeader() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 900);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart = useCartStore((s) => s.openCart);
  const { isMobileMenuOpen, toggleMobileMenu, openLoginModal } = useUiStore();

  useEffect(() => {
    async function performSearch() {
      if (debouncedQuery.length > 1) {
        setIsLoading(true);
        try {
          const res = await api.get<{ data: Product[] }>(
            `/products/search?q=${debouncedQuery}`
          );
          setResults(res.data.data);
        } catch (error) {
          console.error("Search failed:", error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }
    performSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchWrapperRef]);

  function closeAndClearSearch() {
    setIsSearchOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button className="md:hidden" onClick={toggleMobileMenu} aria-label="Menu">
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="shrink-0">
          <img className="h-8 w-auto" src="/images/logo.png" alt="Divantraa Logo" />
        </Link>

        <div className="hidden md:flex items-center justify-center flex-1" ref={searchWrapperRef}>
          <AnimatePresence mode="wait">
            {isSearchOpen ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Find your favourite items"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-ink/10 bg-white pl-5 pr-16 py-2.5 text-sm outline-none focus:border-ink/30"
                />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-2">
                  {query && (
                    <button onClick={() => setQuery("")} aria-label="Clear search">
                      <X size={16} className="text-ink/40 hover:text-ink" />
                    </button>
                  )}
                  <Search size={18} className="text-ink/40" />
                </div>

                {(isLoading || results.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-ink/5 overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto">
                      {isLoading && <p className="p-4 text-sm text-ink/50">Searching...</p>}
                      {!isLoading && results.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/products/${product.slug}`);
                            closeAndClearSearch();
                          }}
                          className="flex items-center gap-4 p-3 hover:bg-cream/50 transition-colors"
                        >
                          <div className="h-14 w-14 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                            {product.images[0] && (
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-ink">{product.title}</p>
                            <p className="text-xs text-ink/60 line-clamp-1">{product.shortDescription}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.nav
                key="nav"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-8 text-sm font-medium text-ink/70"
              >
                <Link href="/products?category=ghee" className="hover:text-forest">All Products</Link>
                <Link href="/products?category=cold-pressed-oils" className="hover:text-forest">Newly Launched</Link>
                <Link href="/products" className="hover:text-forest">Oils</Link>
                <Link href="/products" className="hover:text-forest">Wood Pressed Oils</Link>
                <Link href="/about" className="hover:text-forest">About Us</Link>
                <Link href="/contact" className="hover:text-forest">Contact Us</Link>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative top-1">
            <button
              onClick={() => {
                setIsSearchOpen((v) => !v);
                if (isSearchOpen) closeAndClearSearch();
              }}
              aria-label="Search Product">
              {isSearchOpen ? <X size={24} className="text-ink/70 hover:text-forest" /> : 
                <Search size={24} className="text-[#407a4a] hover:text-forest" />}
            </button>
          </div>
          <div className="h-5 w-5">
            {isClient && user ? (
              <Link href="/account" aria-label="Account">
                <CircleUser size={24} className="text-[#407a4a] hover:text-forest" />
              </Link>
            ) : (
              <button onClick={openLoginModal} aria-label="Sign in">
                <CircleUser size={24} className="text-[#407a4a] hover:text-forest" />
              </button>
            )}
          </div>
          <div className="relative top-1">
            <button onClick={openCart} aria-label="Cart">
              <ShoppingCart size={24} className="text-[#407a4a] hover:text-forest" />
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
