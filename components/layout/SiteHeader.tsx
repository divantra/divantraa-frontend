"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart, CircleUser, Menu, X, Search,
  ShieldCheck, LogOut, Package, User,
  LayoutGrid, Flame, Info, PhoneCall, ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/useUiStore";
import { useLogout } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";
import { useDebounce } from "@/hooks/useDebounce";
import { getImageUrl } from "@/lib/image.utils";

const LOGO = getImageUrl("public/Divanatraa-Logo.png");

const NAV_LINKS = [
  { href: "/products",                            label: "All Products",      icon: <LayoutGrid size={16} /> },
  { href: "/products?category=cold-pressed-oils", label: "Newly Launched",   icon: <Flame      size={16} /> },
  { href: "/products",                            label: "Oils",              icon: null },
  { href: "/products",                            label: "Wood Pressed Oils", icon: null },
  { href: "/about",                               label: "About Us",          icon: <Info       size={16} /> },
  { href: "/contact",                             label: "Contact Us",        icon: <PhoneCall  size={16} /> },
];

export function SiteHeader() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  function isNavActive(href: string, idx: number): boolean {
    const [hrefPath, hrefQuery] = href.split("?");
    if (hrefPath === "/") return pathname === "/";

    const pathMatch = pathname === hrefPath || pathname.startsWith(hrefPath + "/");
    if (!pathMatch) return false;

    if (hrefQuery) {
      // Link has query params — active only if ALL its params match current URL
      const linkP = new URLSearchParams(hrefQuery);
      for (const [k, v] of linkP) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    }

    // Plain path link — skip if a query-param sibling is currently active
    const queryLinkActive = NAV_LINKS.some((l) => {
      if (!l.href.includes("?")) return false;
      const [lp, lq] = l.href.split("?");
      if (lp !== hrefPath) return false;
      const lP = new URLSearchParams(lq);
      for (const [k, v] of lP) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    });
    if (queryLinkActive) return false;

    // Among same-path plain links, only the first one is ever active
    const firstIdx = NAV_LINKS.findIndex((l) => l.href.split("?")[0] === hrefPath && !l.href.includes("?"));
    return idx === firstIdx;
  }

  // ── Search ────────────────────────────────────────────────────────────
  const [query,            setQuery]            = useState("");
  const [results,          setResults]          = useState<Product[]>([]);
  const [searching,        setSearching]        = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const debouncedQuery   = useDebounce(query, 350);
  const searchInputRef   = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // ── Desktop user dropdown ──────────────────────────────────────────────
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  // ── Mobile drawer account accordion ───────────────────────────────────
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  const user      = useAuthStore((s) => s.user);
  const { isHydrated } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount());
  const openCart  = useCartStore((s) => s.openCart);
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, openLoginModal } = useUiStore();
  const logout = useLogout();

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setSearching(true);
    api.get<{ data: Product[] }>(`/products/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => setResults(r.data.data))
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  function clearSearch() { setQuery(""); setResults([]); }

  function handleResultClick(slug: string) {
    router.push(`/products/${slug}`);
    clearSearch();
    setMobileSearchOpen(false);
    closeMobileMenu();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      clearSearch();
      setMobileSearchOpen(false);
      closeMobileMenu();
    }
  }

  function handleMobileClose() {
    closeMobileMenu();
    setMobileAccountOpen(false);
  }

  return (
    <>
      {/* z-50 ensures header is always above product card buttons (z-10) */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">

        {/* ════════════════════════════════════════════════════════════
            DESKTOP HEADER
            ════════════════════════════════════════════════════════════ */}
        <div className="hidden md:block">

          {/* ── Top bar: Logo | Search | User + Cart ── */}
          <div className="border-b border-ink/5">
            <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center gap-6">

              {/* Logo */}
              <Link href="/" className="shrink-0">
                <img className="h-[52px] w-auto" src={LOGO} alt="Divantraa" />
              </Link>

              {/* Search */}
              <div className="flex-1 max-w-2xl mx-auto relative" ref={searchWrapperRef}>
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-full border border-ink/15 bg-white pl-5 pr-12 py-2.5 text-sm outline-none focus:border-leaf/40 transition-colors"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {query && (
                      <button type="button" onClick={clearSearch} aria-label="Clear search">
                        <X size={14} className="text-ink/40 hover:text-ink" />
                      </button>
                    )}
                    <button type="submit" aria-label="Search">
                      <Search size={17} className="text-leaf" />
                    </button>
                  </div>
                </form>

                {(searching || results.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-ink/8 z-50 overflow-hidden">
                    <div className="max-h-[60vh] overflow-y-auto">
                      {searching && <p className="p-4 text-sm text-ink/50">Searching…</p>}
                      {!searching && results.map((p) => (
                        <button key={p.id} onClick={() => handleResultClick(p.slug)}
                          className="w-full flex items-center gap-4 px-4 py-3 hover:bg-cream/60 transition-colors text-left">
                          <div className="h-12 w-12 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                            {p.images[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{p.title}</p>
                            {p.shortDescription && <p className="text-xs text-ink/50 truncate">{p.shortDescription}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User + Cart */}
              <div className="flex items-center gap-5 shrink-0">
                {isClient && isHydrated && (
                  <div className="relative" ref={desktopMenuRef}>
                    {user ? (
                      <>
                        <button
                          onClick={() => setDesktopMenuOpen((v) => !v)}
                          aria-label="Account menu"
                          aria-expanded={desktopMenuOpen}
                          className="flex items-center gap-1.5 group"
                        >
                          <CircleUser size={24} className="text-forest group-hover:text-leaf transition-colors" />
                          <span className="text-xs font-medium text-ink/60 max-w-[80px] truncate group-hover:text-ink">
                            {user.name?.split(" ")[0] ?? "Account"}
                          </span>
                        </button>

                        <AnimatePresence>
                          {desktopMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 6, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 6, scale: 0.97 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-ink/8 py-2 z-[60]"
                            >
                              <div className="px-4 py-3 border-b border-ink/5">
                                <p className="font-medium text-sm text-ink truncate">{user.name ?? "My Account"}</p>
                                <p className="text-xs text-ink/40 mt-0.5">
                                  {user.mobile?.startsWith("+91") ? `+91 ${user.mobile.slice(3)}` : user.mobile}
                                </p>
                              </div>
                              <div className="py-1">
                                <Link href="/account" onClick={() => setDesktopMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors">
                                  <User size={14} className="text-ink/40" /> My Account
                                </Link>
                                <Link href="/account?tab=orders" onClick={() => setDesktopMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors">
                                  <Package size={14} className="text-ink/40" /> My Orders
                                </Link>
                                {user.role === "ADMIN" && (
                                  <Link href="/admin" onClick={() => setDesktopMenuOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors">
                                    <ShieldCheck size={14} className="text-ink/40" /> Admin Panel
                                  </Link>
                                )}
                              </div>
                              <div className="border-t border-ink/5 pt-1">
                                <button
                                  onClick={() => { setDesktopMenuOpen(false); logout.mutate(); }}
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
                      <button
                        onClick={() => openLoginModal()}
                        aria-label="Sign in"
                        className="flex items-center gap-1.5 group"
                      >
                        <CircleUser size={24} className="text-forest group-hover:text-leaf transition-colors" />
                        <span className="text-xs font-medium text-ink/60 group-hover:text-ink whitespace-nowrap">
                          Sign in
                        </span>
                      </button>
                    )}
                  </div>
                )}

                <div className="relative">
                  <button onClick={openCart} aria-label="Cart">
                    <ShoppingCart size={24} className="text-forest hover:text-leaf transition-colors" />
                    {isClient && itemCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-clay text-[10px] leading-4 text-white text-center">
                        {itemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ── Nav bar: full-width centered navigation ── */}
          <nav className="border-b border-ink/8 bg-white">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
              {NAV_LINKS.map((link, idx) => {
                const active = isNavActive(link.href, idx);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`
                      relative px-5 h-10 flex items-center
                      text-[13px] font-medium whitespace-nowrap
                      transition-colors duration-150
                      ${active
                        ? "text-forest"
                        : "text-ink/60 hover:text-forest"
                      }
                    `}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-forest rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

        </div>

        {/* ════════════════════════════════════════════════════════════
            MOBILE TOP BAR
            ════════════════════════════════════════════════════════════ */}
        <div className="md:hidden">
          <div className="px-3 h-14 flex items-center gap-2 border-b border-ink/5">

            <button
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="shrink-0 p-1.5 rounded-lg hover:bg-ink/5 transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <Link href="/" onClick={closeMobileMenu} className="shrink-0">
              <img className="h-12 w-auto" src={LOGO} alt="Divantraa" />
            </Link>

            <div className="flex-1" />

            <button
              onClick={() => {
                setMobileSearchOpen((v) => !v);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              aria-label={mobileSearchOpen ? "Close search" : "Search"}
              className="p-1.5 rounded-lg hover:bg-ink/5 transition-colors"
            >
              {mobileSearchOpen
                ? <X size={22} className="text-forest" />
                : <Search size={22} className="text-forest" />}
            </button>

            <div className="relative">
              <button
                onClick={openCart}
                aria-label="Cart"
                className="p-1.5 rounded-lg hover:bg-ink/5 transition-colors"
              >
                <ShoppingCart size={22} className="text-forest" />
                {isClient && itemCount > 0 && (
                  <span className="absolute -top-0.5 right-0 h-4 min-w-4 px-1 rounded-full bg-clay text-[10px] leading-4 text-white text-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

          </div>

          {/* Mobile search slide-down */}
          <AnimatePresence>
            {mobileSearchOpen && (
              <motion.div
                key="mobile-search"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-b border-ink/5 bg-white"
              >
                <form onSubmit={handleSearchSubmit} className="relative px-4 py-3">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-full border border-ink/15 bg-white pl-4 pr-10 py-2.5 text-sm outline-none focus:border-leaf/40 transition-colors"
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
                          <button key={p.id} onClick={() => handleResultClick(p.slug)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cream/60 transition-colors text-left">
                            <div className="h-10 w-10 rounded-lg bg-ink/5 overflow-hidden relative shrink-0">
                              {p.images[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
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

      {/* ════════════════════════════════════════════════════════════
          MOBILE MENU DRAWER
          ════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              onClick={handleMobileClose}
              aria-hidden="true"
            />

            <motion.div
              key="mobile-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
              className="fixed left-0 top-0 bottom-0 z-[51] w-[300px] max-w-[85vw] bg-white flex flex-col shadow-2xl md:hidden"
              aria-label="Mobile navigation"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-ink/8 shrink-0">
                <Link href="/" onClick={handleMobileClose} className="shrink-0">
                  <img className="h-12 w-auto" src={LOGO} alt="Divantraa" />
                </Link>
                <button onClick={handleMobileClose} aria-label="Close menu"
                  className="p-2 rounded-lg hover:bg-ink/5 transition-colors text-ink/60">
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto py-3 px-2">
                <ul className="space-y-0.5">
                  {NAV_LINKS.map((link, idx) => {
                    const active = isNavActive(link.href, idx);
                    return (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          onClick={handleMobileClose}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors
                            ${active
                              ? "bg-forest/8 text-forest"
                              : "text-ink/80 hover:bg-cream hover:text-forest"
                            }
                          `}
                        >
                          {link.icon && (
                            <span className="text-forest shrink-0">{link.icon}</span>
                          )}
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <div className="my-3 border-t border-ink/8" />

                <Link href="/cart" onClick={handleMobileClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink/80 hover:bg-cream hover:text-forest transition-colors">
                  <ShoppingCart size={16} className="text-forest" />
                  Cart
                  {isClient && itemCount > 0 && (
                    <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-clay text-[10px] leading-5 text-white text-center">
                      {itemCount}
                    </span>
                  )}
                </Link>

                <div className="my-3 border-t border-ink/8" />

                {isClient && isHydrated && (
                  user ? (
                    <div>
                      <button
                        onClick={() => setMobileAccountOpen((v) => !v)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ink/80 hover:bg-cream transition-colors"
                        aria-expanded={mobileAccountOpen}
                      >
                        <CircleUser size={16} className="text-forest shrink-0" />
                        <span className="flex-1 text-left truncate">{user.name ?? "My Account"}</span>
                        <motion.span
                          animate={{ rotate: mobileAccountOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0"
                        >
                          <ChevronDown size={16} className="text-ink/40" />
                        </motion.span>
                      </button>

                      <AnimatePresence initial={false}>
                        {mobileAccountOpen && (
                          <motion.div
                            key="account-panel"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="overflow-hidden"
                          >
                            <ul className="pt-1 pb-2 pl-6 space-y-0.5">
                              <li>
                                <Link href="/account" onClick={handleMobileClose}
                                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors">
                                  <User size={14} className="text-ink/40 shrink-0" /> My Account
                                </Link>
                              </li>
                              <li>
                                <Link href="/account?tab=orders" onClick={handleMobileClose}
                                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors">
                                  <Package size={14} className="text-ink/40 shrink-0" /> My Orders
                                </Link>
                              </li>
                              {user.role === "ADMIN" && (
                                <li>
                                  <Link href="/admin" onClick={handleMobileClose}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink/70 hover:bg-cream hover:text-ink transition-colors">
                                    <ShieldCheck size={14} className="text-ink/40 shrink-0" /> Admin Panel
                                  </Link>
                                </li>
                              )}
                              <li>
                                <button
                                  onClick={() => { handleMobileClose(); logout.mutate(); }}
                                  disabled={logout.isPending}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <LogOut size={14} className="shrink-0" />
                                  {logout.isPending ? "Logging out…" : "Log out"}
                                </button>
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button
                      onClick={() => { openLoginModal(); handleMobileClose(); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-leaf transition-colors"
                    >
                      <CircleUser size={16} />
                      Sign in / Sign up
                    </button>
                  )
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
