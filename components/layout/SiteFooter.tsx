"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Facebook,
  Instagram,
  Mail,
  X,
} from "lucide-react";

import { CartFooterBar } from "../cart/CartFooterBar";
import { getImageUrl } from "@/lib/image.utils";

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
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) return;

    setSubscribed(true);
    setEmail("");
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
        <div className="relative z-10 px-[20px] pt-[30px] pb-[25px]">

          <div
            className="
              grid
              grid-cols-[3.8fr_1.9fr_1.9fr_0.6fr]
              gap-[40px]
              mb-4
            "
          >

            {/* =================================================
                LEFT
            ================================================= */}
            <div>

              {/* ADDRESS */}
              <div className="text-[16px] leading-[1.55] text-white/85">

                <p>
                  <span className="font-bold text-white">
                    Corporate Office -
                  </span>{" "}
                  475, 7th Main, Hampinagar,
                  <br />
                  Bangalore 560040
                </p>

                <p className="mt-[18px]">
                  <span className="font-bold text-white">
                    Registered Office -
                  </span>{" "}
                  475, 7th Main, Hampinagar,
                  <br />
                  Bangalore 560040
                </p>

              </div>

              {/* GRIEVANCE */}
              <p className="mt-[48px] text-[16px] leading-[1.5] text-white/85">
                Grievance Redressal Officer:{" "}
                <Link
                  href="/contact"
                  className="text-white underline underline-offset-2 hover:text-[#dfc77f]"
                >
                  Contact Support
                </Link>
              </p>

              {/* NEWSLETTER */}
              <div className="mt-[48px] max-w-[625px]">
                <h4 className="mb-[15px] text-[17px] font-bold uppercase text-white">
                  SUBSCRIBE TO OUR NEWSLETTER
                </h4>

                <form
                  onSubmit={handleSubscribe}
                  className="flex h-[64px] w-full border border-white/55"
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
                      px-[34px]
                      text-[16px]
                      text-white
                      outline-none
                      placeholder:text-white/75
                    "
                  />

                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="
                      w-[70px]
                      text-[28px]
                      text-white
                      hover:text-[#dfc77f]
                    "
                  >
                    ↓
                  </button>
                </form>

                {subscribed && (
                  <p className="mt-2 text-xs text-white/70">
                    Thanks — you're on the list.
                  </p>
                )}

              </div>
            </div>

            {/* =================================================
                SERVICES
            ================================================= */}
            <div>

              <h4 className="mb-[28px] text-[18px] font-bold text-[#dfc77f]">
                SERVICES
              </h4>

              <ul className="space-y-[12px]">
                {serviceLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-[16px]
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

              <h4 className="mb-[28px] text-[18px] font-bold text-[#dfc77f]">
                POLICIES
              </h4>

              <ul className="space-y-[12px]">
                {policyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="
                        text-[16px]
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
            <div>

              <h4 className="mb-[20px] text-[18px] font-bold text-[#dfc77f]">
                NEED HELP?
              </h4>

              {/* CONTACT BUTTON */}
              <Link
                href="/contact"
                className="
                  flex
                  h-[62px]
                  w-full
                  items-center
                  justify-center
                  rounded-full
                  bg-[#dfc77f]
                  text-[17px]
                  font-medium
                  text-[#00665c]
                  transition
                  hover:bg-[#ead99e]
                "
              >
                Contact Us
              </Link>

              {/* SOCIAL */}
              <div className="mt-[25px] flex gap-[20px]">

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="
                    flex
                    h-[66px]
                    w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <Facebook size={25} strokeWidth={2.2} />
                </a>

                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="
                    flex
                    h-[66px]
                    w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <Instagram size={25} strokeWidth={2.2} />
                </a>

                <a
                  href="mailto:divantraa@rediffmail.com"
                  aria-label="Email"
                  className="
                    flex
                    h-[66px]
                    w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <Mail size={25} strokeWidth={2.2} />
                </a>

                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X"
                  className="
                    flex
                    h-[66px]
                    w-[66px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#dfc77f]
                    text-[#00665c]
                  "
                >
                  <X size={25} strokeWidth={2.2} />
                </a>

              </div>

              {/* DOWNLOAD APP */}
              <div className="mt-[28px]">

                <p className="mb-[14px] text-[18px] font-medium text-[#dfc77f]">
                  Download App
                </p>

                <div className="flex gap-[18px]">

                  {/* GOOGLE PLAY */}
                  <a
                    href="#"
                    className="
                      flex
                      h-[62px]
                      w-[185px]
                      items-center
                      justify-center
                      rounded-full
                      bg-black
                      text-white
                    "
                  >
                    <div className="flex items-center gap-3">

                      <span className="text-[28px]">
                        ▶
                      </span>

                      <div className="leading-none">
                        <div className="text-[8px] uppercase">
                          Get it on
                        </div>

                        <div className="mt-1 text-[16px]">
                          Google Play
                        </div>
                      </div>

                    </div>
                  </a>

                  {/* APP STORE */}
                  <a
                    href="#"
                    className="
                      flex
                      h-[62px]
                      w-[185px]
                      items-center
                      justify-center
                      rounded-full
                      bg-black
                      text-white
                    "
                  >
                    <div className="flex items-center gap-3">

                      <span className="text-[25px]">
                        ●
                      </span>

                      <div className="leading-none">
                        <div className="text-[8px]">
                          Download on the
                        </div>

                        <div className="mt-1 text-[16px]">
                          App Store
                        </div>
                      </div>

                    </div>
                  </a>

                </div>

              </div>

            </div>

          </div>

          {/* COPYRIGHT */}
          <div className="border-t border-white/10 pt-4 text-center text-[14px] text-white/75">
            Copyright © {new Date().getFullYear()}, Divantraa. All rights reserved.
          </div>
        </div>
      </footer>
      <CartFooterBar />
    </>
  );
}