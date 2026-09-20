"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart, CircleUser, Menu, X, Search,
  ShieldCheck, LogOut, Package, User,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { useLogout } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import { useDebounce } from "@/hooks/useDebounce";
import { getImageUrl } from "@/lib/image.utils";

function DropdownLink({
  href, icon, label, onClick,
}: {
  href: string; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors"
    >
      <span className="text-ink/40">{icon}</span>
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const router = useRouter();

  // ── Search state ──────────────────────────────────────────────
  const [query,            setQuery]            = useState("");
  const [results,          setResults]          = useState<Product[]>([]);
  const [searching,        setSearching]        = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const debouncedQuery   = useDebounce(query, 350);
  const searchInputRef   = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // ── User menu ─────────────────────────────────────────────────
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user      = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart  = useCartStore((s) => s.openCart);
  const { isMobileMenuOpen, toggleMobileMenu, openLoginModal } = useUiStore();
  const logout = useLogout();

  // Close user menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Fetch search results
  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setSearching(true);
    api.get<{ data: Product[] }>(`/products/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => setResults(r.data.data))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  function clearSearch() {
    setQuery("");
    setResults([]);
  }

  function handleResultClick(slug: string) {
    router.push(`/products/${slug}`);
    clearSearch();
    setMobileSearchOpen(false);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      clearSearch();
      setMobileSearchOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-ink/5">

      {/* ══════════════════════════════════════════════════════════
          DESKTOP — 3-column grid
          ┌──────────┬──────────────────────────┬──────────┐
          │          │   Search products…  [🔍] │          │
          │  [Logo]  ├──────────────────────────┤ [👤][🛒] │
          │          │  All Prods | Nav Links…  │          │
          └──────────┴──────────────────────────┴──────────┘
          Logo and User+Cart each span both inner rows,
          vertically centered. Search + Nav stack in the middle.
          ══════════════════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_auto]">

          {/* ── LEFT: Logo — row-span-2, vertically centered ─── */}
          <div className="row-span-2 flex items-center pr-6 my-2">
            <Link href="/" className="shrink-0">
              <img
                className="h-[80px] w-[150px]"
                src={getImageUrl("public/Divanatraa-Logo.png")}
                alt="Divantraa"
              />
            </Link>
          </div>

          {/* ── CENTER TOP: Search bar ───────────────────────── */}
          <div className="flex items-center px-6 pt-3 pb-2 relative" ref={searchWrapperRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-full border border-ink/15 bg-white pl-5 pr-12 py-2 text-sm outline-none focus:border-leaf/40 focus:bg-white transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {query && (
                  <button type="button" onClick={clearSearch} aria-label="Clear search">
                    <X size={14} className="text-ink/40 hover:text-ink" />
                  </button>
                )}
                <button type="submit" aria-label="Search">
                  <Search size={18} className="text-leaf" />
                </button>
              </div>

              {/* Suggestions dropdown */}
              {(searching || results.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-ink/8 z-50 overflow-hidden">
                  <div className="max-h-[60vh] overflow-y-auto">
                    {searching && <p className="p-4 text-sm text-ink/50">Searching…</p>}
                    {!searching && results.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleResultClick(p.slug)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-cream/60 transition-colors text-left"
                      >
                        <div className="h-12 w-12 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                          {p.images[0] && (
                            <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{p.title}</p>
                          {p.shortDescription && (
                            <p className="text-xs text-ink/50 truncate">{p.shortDescription}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── RIGHT: User + Cart — row-span-2, vertically centered */}
          <div className="row-span-2 flex items-center gap-5 pl-6 my-2">

            {/* Account icon + dropdown */}
            <div className="relative" ref={userMenuRef}>
              {isClient && user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-label="Account menu"
                    className="flex items-center gap-1.5 group"
                  >
                    <CircleUser size={24} className="text-[#407a4a] group-hover:text-forest transition-colors" />
                    <span className="text-xs font-medium text-ink/60 max-w-[80px] truncate group-hover:text-ink">
                      {user.name?.split(" ")[0] ?? "Account"}
                    </span>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-ink/8 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-ink/5">
                          <p className="font-medium text-sm text-ink truncate">{user.name ?? "My Account"}</p>
                          <p className="text-xs text-ink/40 mt-0.5">
                            {user.mobile.startsWith("+91") ? `+91 ${user.mobile.slice(3)}` : user.mobile}
                          </p>
                        </div>
                        <div className="py-1">
                          <DropdownLink href="/account"            icon={<User size={14} />}        label="My Account"  onClick={() => setUserMenuOpen(false)} />
                          <DropdownLink href="/account?tab=orders" icon={<Package size={14} />}     label="My Orders"   onClick={() => setUserMenuOpen(false)} />
                          {user.role === "ADMIN" && (
                            <DropdownLink href="/admin"            icon={<ShieldCheck size={14} />} label="Admin Panel" onClick={() => setUserMenuOpen(false)} />
                          )}
                        </div>
                        <div className="border-t border-ink/5 pt-1">
                          <button
                            onClick={() => { setUserMenuOpen(false); logout.mutate(); }}
                            disabled={logout.isPending}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={14} />
                            {logout.isPending ? "Logging out…" : "Log out"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button onClick={openLoginModal} aria-label="Sign in">
                  <CircleUser size={24} className="text-[#407a4a] hover:text-forest transition-colors" />
                </button>
              )}
            </div>

            {/* Cart icon + badge */}
            <div className="relative">
              <button onClick={openCart} aria-label="Cart">
                <ShoppingCart size={24} className="text-[#407a4a] hover:text-forest" />
                {isClient && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-clay text-[10px] leading-4 text-white text-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── CENTER BOTTOM: Navigation links ─────────────── */}
          <div className="px-6 pb-2">
            <nav className="flex items-center justify-center gap-8 h-9 text-sm font-medium text-ink/70">
              <Link href="/products"                             className="hover:text-forest transition-colors whitespace-nowrap">All Products</Link>
              <Link href="/products?category=wood-pressed-oils" className="hover:text-forest transition-colors whitespace-nowrap">Newly Launched</Link>
              <Link href="/products"                             className="hover:text-forest transition-colors whitespace-nowrap">Oils</Link>
              <Link href="/products"                             className="hover:text-forest transition-colors whitespace-nowrap">Wood Pressed Oils</Link>
              <Link href="/about"                                className="hover:text-forest transition-colors whitespace-nowrap">About Us</Link>
              <Link href="/contact"                              className="hover:text-forest transition-colors whitespace-nowrap">Contact Us</Link>
            </nav>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          MOBILE — single row: Hamburger | Logo | Search toggle | User | Cart
          ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden">
        <div className="px-4 h-16 flex items-center gap-3">

          <button onClick={toggleMobileMenu} aria-label="Menu" className="shrink-0">
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="shrink-0">
            <img className="h-8 w-auto" src={getImageUrl("public/logo.png")} alt="Divantraa" />
          </Link>

          <div className="flex-1" />

          {/* Search toggle */}
          <button
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            aria-label="Search"
          >
            {mobileSearchOpen
              ? <X size={22} className="text-[#407a4a]" />
              : <Search size={22} className="text-[#407a4a]" />}
          </button>

          {/* Account */}
          <div className="relative" ref={userMenuRef}>
            {isClient && user ? (
              <>
                <button onClick={() => setUserMenuOpen((v) => !v)} aria-label="Account menu">
                  <CircleUser size={24} className="text-[#407a4a]" />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-ink/8 py-2 z-50"
                    >
                      <div className="px-4 py-3 border-b border-ink/5">
                        <p className="font-medium text-sm text-ink truncate">{user.name ?? "My Account"}</p>
                        <p className="text-xs text-ink/40 mt-0.5">
                          {user.mobile.startsWith("+91") ? `+91 ${user.mobile.slice(3)}` : user.mobile}
                        </p>
                      </div>
                      <div className="py-1">
                        <DropdownLink href="/account"            icon={<User size={14} />}        label="My Account"  onClick={() => setUserMenuOpen(false)} />
                        <DropdownLink href="/account?tab=orders" icon={<Package size={14} />}     label="My Orders"   onClick={() => setUserMenuOpen(false)} />
                        {user.role === "ADMIN" && (
                          <DropdownLink href="/admin"            icon={<ShieldCheck size={14} />} label="Admin Panel" onClick={() => setUserMenuOpen(false)} />
                        )}
                      </div>
                      <div className="border-t border-ink/5 pt-1">
                        <button
                          onClick={() => { setUserMenuOpen(false); logout.mutate(); }}
                          disabled={logout.isPending}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} />
                          {logout.isPending ? "Logging out…" : "Log out"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button onClick={openLoginModal} aria-label="Sign in">
                <CircleUser size={24} className="text-[#407a4a]" />
              </button>
            )}
          </div>

          {/* Cart */}
          <div className="relative">
            <button onClick={openCart} aria-label="Cart">
              <ShoppingCart size={24} className="text-[#407a4a]" />
              {isClient && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-clay text-[10px] leading-4 text-white text-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              key="mobile-search"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-ink/5 bg-white"
            >
              <form onSubmit={handleSearchSubmit} className="relative px-4 py-3">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-ink/15 bg-white pl-4 pr-10 py-2.5 text-sm outline-none focus:border-leaf/40 focus:bg-white transition-colors"
                  autoFocus
                />
                <div className="absolute right-7 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {query && (
                    <button type="button" onClick={clearSearch} aria-label="Clear">
                      <X size={14} className="text-ink/40" />
                    </button>
                  )}
                  <button type="submit" aria-label="Search">
                    <Search size={17} className="text-leaf" />
                  </button>
                </div>

                {(searching || results.length > 0) && (
                  <div className="absolute top-full left-4 right-4 bg-white rounded-xl shadow-xl border border-ink/8 z-50 overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {searching && <p className="p-4 text-sm text-ink/50">Searching…</p>}
                      {!searching && results.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleResultClick(p.slug)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream/60 transition-colors text-left"
                        >
                          <div className="h-10 w-10 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                            {p.images[0] && (
                              <Image src={p.images[0]} alt={p.title} fill className="object-cover" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-ink truncate">{p.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </header>
  );
}
