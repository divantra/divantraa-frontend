"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Facebook, Instagram, Twitter, MessageCircle, ShieldCheck } from "lucide-react";

const certifications = ["ISO 9001:2015", "ISO 22000:2018", "FSSAI", "FDA", "GMP", "HACCP", "IAF"];

const serviceLinks = [
  { label: "Shop", href: "/products" },
  { label: "Track your order", href: "/account" },
  { label: "Our story", href: "/#story" },
  { label: "Blog", href: "/blogs" },
  { label: "Contact us", href: "/contact" },
];

const policyLinks = [
  { label: "Privacy policy", href: "/policies/privacy" },
  { label: "Shipping policy", href: "/policies/shipping" },
  { label: "Refund policy", href: "/policies/refund" },
  { label: "Terms of service", href: "/policies/terms" },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: MessageCircle, href: "https://wa.me/910000000000", label: "WhatsApp" },
];

/**
 * Full-width footer: certification strip, brand + newsletter, service links,
 * policy links, and a "need help" contact card with social icons.
 * Self-contained — swap this file in to replace the footer wholesale.
 */
export function SiteFooter() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    // Wire this up to your newsletter provider / backend endpoint.
    setSubscribed(true);
    setEmail("");
  }

  return (
    <footer className="relative bg-forest text-white overflow-hidden bg-cover pt-8"
      style={{
        backgroundImage: "url('/images/divantraa-footer-background-image-DbOeJ5S1.webp')",
      }}>
      {/* Certification strip */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10">
        <div className="bg-white rounded-md px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 w-fit mx-auto sm:mx-0">
          {certifications.map((cert) => (
            <div key={cert} className="flex items-center gap-1.5 text-forest">
              <ShieldCheck size={16} className="shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">{cert}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand + newsletter */}
        <div>
          <h2 className="font-display text-3xl text-gold mb-2">Divantraa</h2>
          <p className="text-cream/70 text-sm mb-5">Farm to home — pure, traceable, lab-tested.</p>

          <div className="text-sm text-cream/80 space-y-1 mb-6">
            <p><span className="font-semibold text-cream">Corporate office:</span> Bangalore</p>
            <p><span className="font-semibold text-cream">Registered office:</span> Bangalore</p>
          </div>

          <p className="text-sm font-semibold text-cream mb-3">Subscribe to our newsletter</p>
          <form onSubmit={handleSubscribe} className="flex gap-0 max-w-sm">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 min-w-0 rounded-l-md px-4 py-2.5 text-sm text-ink bg-cream outline-none"
            />
            <button
              type="submit"
              className="rounded-r-md bg-gold text-forest text-sm font-semibold px-5 py-2.5 hover:opacity-90 transition-opacity shrink-0"
            >
              Subscribe
            </button>
          </form>
          {isClient && subscribed && (
            <p className="text-xs text-gold mt-2">Thanks — you&apos;re on the list.</p>
          )}
        </div>

        {/* Services */}
        <div>
          <h3 className="text-gold font-semibold mb-4">Services</h3>
          <ul className="space-y-2.5 text-sm text-cream/80">
            {serviceLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-cream transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="text-gold font-semibold mb-4">Policies</h3>
          <ul className="space-y-2.5 text-sm text-cream/80">
            {policyLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-cream transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Need help */}
        <div>
          <h3 className="text-gold font-semibold mb-4">Need help?</h3>
          <Link
            href="/contact"
            className="inline-block rounded-md bg-gold text-forest text-sm font-semibold px-5 py-2.5 mb-5 hover:opacity-90 transition-opacity"
          >
            Contact us
          </Link>
          <div className="flex items-center gap-3 mb-6">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="h-9 w-9 rounded-full bg-cream/10 flex items-center justify-center hover:bg-cream/20 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-cream/10 px-6 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Divantraa. All rights reserved.
      </div>
    </footer>
  );
}
