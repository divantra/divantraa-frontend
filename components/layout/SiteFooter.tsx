"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Mail,
  X,
} from "lucide-react";

import { getImageUrl } from "@/lib/image.utils";
import { api } from "@/lib/api";
import { getAxiosErrorMessage } from "@/lib/errorUtils";
import { CartFooterBar } from "@/components/cart/CartFooterBar";

const FOOTER_BG = getImageUrl("public/divantraa-footer-background-image.webp");

const serviceLinks = [
  { label: "Shop", href: "/products" },
  { label: "Track Your Order", href: "/track-order" },
  { label: "Our Story", href: "/#story" },
  { label: "Blog", href: "/blogs" },
  { label: "Corporate Info", href: "/corporate-info" },
  { label: "Contact Us", href: "/contact" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Shipping Policy", href: "/policies/shipping" },
  { label: "Refund Policy", href: "/policies/refund" },
  { label: "Terms of Service", href: "/policies/terms" },
  { label: "Sitemap", href: "/sitemap" },
];

export function SiteFooter() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) return;

    setSubscribing(true);
    setSubscribeError(null);
    try {
      await api.post("/newsletter/subscribe", { email: email.trim() });
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setSubscribeError(getAxiosErrorMessage(err, "Couldn't subscribe right now. Please try again."));
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <>
      <footer className="relative overflow-hidden bg-[#00665c] text-white">

        {/* =====================================================
            BACKGROUND IMAGE
        ====================================================== */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src={FOOTER_BG}
            alt=""
            fill
            priority
            className="object-cover object-bottom opacity-60"
          />
        </div>

        {/* Green overlay */}
        <div className="absolute inset-0 z-[1] bg-[#00665c]/25 pointer-events-none" />

        {/* =====================================================
            FOOTER CONTENT
        ====================================================== */}
        <div className="relative z-10 px-5 pt-8 pb-6 sm:px-8 md:px-10 lg:px-[20px] lg:pt-[30px] lg:pb-[25px]">

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-[3.8fr_1.9fr_1.9fr_0.6fr]
              gap-y-10
              gap-x-8
              lg:gap-[40px]
              mb-4
            "
          >

            {/* =================================================
                LEFT
            ================================================= */}
            <div className="sm:col-span-2 lg:col-span-1">

              {/* ADDRESS */}
              <div className="text-sm sm:text-base lg:text-[16px] leading-[1.55] text-white/85">

                <p>
                  <span className="font-bold text-white">
                    Corporate Office -
                  </span>{" "}
                  475, 7th Main, Hampinagar,
                  <br />
                  Bangalore 560040
                </p>

                <p className="mt-4 lg:mt-[18px]">
                  <span className="font-bold text-white">
                    Registered Office -
                  </span>{" "}
                  475, 7th Main, Hampinagar,
                  <br />
                  Bangalore 560040
                </p>

              </div>

              {/* GRIEVANCE */}
              <p className="mt-8 lg:mt-[48px] text-sm sm:text-base lg:text-[16px] leading-[1.5] text-white/85">
                Grievance Redressal Officer:{" "}
                <Link
                  href="/contact"
                  className="text-white underline underline-offset-2 hover:text-[#dfc77f]"
                >
                  Contact Support
                </Link>
              </p>

              {/* NEWSLETTER */}
              <div className="mt-8 lg:mt-[48px] w-full lg:max-w-[625px]">
                <h4 className="mb-3 lg:mb-[15px] text-sm sm:text-base lg:text-[17px] font-bold uppercase text-white">
                  SUBSCRIBE TO OUR NEWSLETTER
                </h4>

                <form
                  onSubmit={handleSubscribe}
                  className="flex h-12 sm:h-14 lg:h-[64px] w-full border border-white/55"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      px-4
                      sm:px-6
                      lg:px-[34px]
                      text-sm
                      sm:text-base
                      lg:text-[16px]
                      text-white
                      outline-none
                      placeholder:text-white/75
                    "
                  />

                  <button
                    type="submit"
                    aria-label="Subscribe"
                    disabled={subscribing}
                    className="
                      w-12
                      sm:w-14
                      lg:w-[70px]
                      text-xl
                      sm:text-2xl
                      lg:text-[28px]
                      text-white
                      hover:text-[#dfc77f]
                      disabled:opacity-50
                    "
                  >
                    ↓
                  </button>
                </form>

                {subscribed && (
                  <p className="mt-2 text-xs text-white/70">
                    Thanks — you&apos;re on the list.
                  </p>
                )}
                {subscribeError && (
                  <p className="mt-2 text-xs text-red-200">
                    {subscribeError}
                  </p>
                )}

              </div>
            </div>

            {/* =================================================
                SERVICES
            ================================================= */}
            <div>

              <h4 className="mb-4 lg:mb-[28px] text-base sm:text-[18px] font-bold text-[#dfc77f]">
                SERVICES
              </h4>

              <ul className="space-y-3 lg:space-y-[12px]">
                {serviceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-sm
                        sm:text-[16px]
                        leading-none
                        text-white/85
                        transition
                        hover:text-white
                      "
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

            </div>

            {/* =================================================
                POLICIES
            ================================================= */}
            <div>

              <h4 className="mb-4 lg:mb-[28px] text-base sm:text-[18px] font-bold text-[#dfc77f]">
                POLICIES
              </h4>

              <ul className="space-y-3 lg:space-y-[12px]">
                {policyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-sm
                        sm:text-[16px]
                        leading-[1.35]
                        text-white/85
                        transition
                        hover:text-white
                      "
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

            </div>

            {/* =================================================
                NEED HELP
            ================================================= */}
            <div className="sm:col-span-2 lg:col-span-1">

              <h4 className="mb-4 lg:mb-[20px] text-base sm:text-[18px] font-bold text-[#dfc77f]">
                NEED HELP?
              </h4>

              {/* CONTACT BUTTON */}
              <Link
                href="/contact"
                className="
                  flex
                  h-12
                  sm:h-14
                  lg:h-[62px]
                  w-full
                  sm:w-auto
                  lg:w-full
                  items-center
                  justify-center
                  rounded-full
                  bg-[#dfc77f]
                  px-8
                  text-base
                  lg:text-[17px]
                  font-medium
                  text-[#00665c]
                  transition
                  hover:bg-[#ead99e]
                "
              >
                Contact Us
              </Link>

              {/* SOCIAL */}
              <div className="mt-5 lg:mt-[25px] flex gap-3 sm:gap-4 lg:gap-[20px]">

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="
                    flex
                    h-12
                    w-12
                    sm:h-14
                    sm:w-14
                    lg:h-[66px]
                    lg:w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <Facebook className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="
                    flex
                    h-12
                    w-12
                    sm:h-14
                    sm:w-14
                    lg:h-[66px]
                    lg:w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                </a>

                <a
                  href="mailto:divantraa@rediffmail.com"
                  aria-label="Email"
                  className="
                    flex
                    h-12
                    w-12
                    sm:h-14
                    sm:w-14
                    lg:h-[66px]
                    lg:w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                </a>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="
                    flex
                    h-12
                    w-12
                    sm:h-14
                    sm:w-14
                    lg:h-[66px]
                    lg:w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
                </a>

              </div>

            </div>

          </div>

          {/* COPYRIGHT */}
          <div className="border-t border-white/10 pt-4 text-center text-xs sm:text-sm lg:text-[14px] text-white/75">
            Copyright © {new Date().getFullYear()}, Divantraa. All rights reserved.
          </div>
        </div>
      </footer>
      <CartFooterBar />
    </>
  );
}