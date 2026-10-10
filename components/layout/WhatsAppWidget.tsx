"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "919008301490";
const WHATSAPP_MESSAGE = "Hi! I'd like to know more about Divantraa products.";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const CALL_HREF = "tel:+919008301490";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden="true">
      <path d="M713.5 599.9c-10.9-5.6-65.2-32.2-75.3-35.8-10.1-3.8-17.5-5.6-24.8 5.6-7.4 11.1-28.4 35.8-35 43.3-6.4 7.4-12.9 8.3-23.8 2.8-64.8-32.4-107.3-57.8-150-131.1-11.3-19.5 11.3-18.1 32.4-60.2 3.6-7.4 1.8-13.7-1-19.3-2.8-5.6-24.8-59.8-34-81.9-8.9-21.5-18.1-18.5-24.8-18.9-6.4-0.4-13.7-0.4-21.1-0.4-7.4 0-19.3 2.8-29.4 13.7-10.1 11.1-38.6 37.8-38.6 92s39.5 106.7 44.9 114.1c5.6 7.4 77.7 118.6 188.4 166.5 70 30.2 97.4 32.8 132.4 27.6 21.3-3.2 65.2-26.6 74.3-52.5 9.1-25.8 9.1-47.9 6.4-52.5-2.7-4.9-10.1-7.7-21-13z" />
      <path d="M925.2 338.4c-22.6-53.7-55-101.9-96.3-143.3-41.3-41.3-89.5-73.8-143.3-96.3C630.6 75.7 572.2 64 512 64h-2c-60.6 0.3-119.3 12.3-174.5 35.9-53.3 22.8-101.1 55.2-142 96.5-40.9 41.3-73 89.3-95.2 142.8-23 55.4-34.6 114.3-34.3 174.9 0.3 69.4 16.9 138.3 48 199.9v152c0 25.4 20.6 46 46 46h152.1c61.6 31.1 130.5 47.7 199.9 48h2.1c59.9 0 118-11.6 172.7-34.3 53.5-22.3 101.6-54.3 142.8-95.2 41.3-40.9 73.8-88.7 96.5-142 23.6-55.2 35.6-113.9 35.9-174.5 0.3-60.9-11.5-120-34.8-175.6z m-151.1 438C704 845.8 611 884 512 884h-1.7c-60.3-0.3-120.2-15.3-173.1-43.5l-8.4-4.5H188V695.2l-4.5-8.4C155.3 633.9 140.3 574 140 513.7c-0.4-99.7 37.7-193.3 107.6-263.8 69.8-70.5 163.1-109.5 262.8-109.9h1.7c50 0 98.5 9.7 144.2 28.9 44.6 18.7 84.6 45.6 119 80 34.3 34.3 61.3 74.4 80 119 19.4 46.2 29.1 95.2 28.9 145.8-0.6 99.6-39.7 192.9-110.1 262.7z" />
    </svg>
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a9 9 0 0 0-9 9v4.5A3.5 3.5 0 0 0 6.5 19H8a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H5v-1a7 7 0 1 1 14 0v1h-3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h2.5a3.49 3.49 0 0 1-3.02 1.74H13a1 1 0 1 0 0 2h2.48A5.5 5.5 0 0 0 21 17.5V11a9 9 0 0 0-9-9z" />
    </svg>
  );
}

export function WhatsAppWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-3">

      {/* =====================================================
          POPUP CARD
      ====================================================== */}
      {open && (
        <div
          className="
            w-[88vw]
            max-w-[320px]
            overflow-hidden
            rounded-3xl
            bg-white
            shadow-2xl
          "
        >
          {/* Header */}
          <div className="relative bg-forest px-5 pb-5 pt-6 text-center">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-white/80 transition hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="mx-auto h-11 w-11 overflow-hidden rounded-full bg-white/10 p-1.5">
              <Image
                src="/logo-mark.png"
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-contain"
              />
            </div>

            <p className="mt-2 text-[17px] font-bold text-white">Divantraa</p>
            <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[13px] text-white/75">
              {/* <span className="h-2 w-2 rounded-full bg-[#4ade80]" /> */}
              Online now
            </p>
          </div>

          {/* Message bubble */}
          <div className="bg-[#efe9e0] px-4 py-5">
            <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-[14px] leading-relaxed text-ink/80 shadow-sm">
              Hi there! 👋 Welcome to Divantraa. Tap below to chat with our team on WhatsApp.
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 bg-white px-4 py-4">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex
                h-10
                w-full
                items-center
                justify-center
                gap-2.5
                rounded-full
                bg-[#1ebe5a]
                text-[15px]
                font-semibold
                text-white
                transition
                hover:bg-[#1ebe5a]
              "
            >
              <WhatsAppIcon className="h-5 w-5 fill-white" />
              Chat on WhatsApp
            </a>

            <a
              href={CALL_HREF}
              className="
                flex
                h-10
                w-full
                items-center
                justify-center
                gap-2.5
                rounded-full
                bg-[#00665c]
                text-[15px]
                font-semibold
                text-white
                transition
                hover:bg-[#004f47]
              "
            >
              <Phone size={18} />
              Call Us
            </a>
          </div>
        </div>
      )}

      {/* ===================================================== TOGGLE BUTTON ====================================================== */}
      <button 
        type="button"
        onClick={() => setOpen((v) => !v)} 
        aria-label={open ? "Close chat widget" : "Chat with us on WhatsApp"} 
        aria-expanded={open} 
        className=" relative flex h-11 w-11 items-center justify-center rounded-full bg-[#075E54] shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 " >
          <SupportIcon className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}
