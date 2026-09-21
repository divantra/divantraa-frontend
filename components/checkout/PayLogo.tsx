"use client";

import { useState } from "react";

/**
 * Payment brand mark. Looks for /public/payment-logos/<name>.svg (or .png) and shows a neutral text chip
 * until the official file is added — see public/payment-logos/README.md for the file names.
 */
export function PayLogo({ name, label, className = "h-5" }: { name: string; label: string; className?: string }) {
  const [ext, setExt] = useState<"svg" | "png" | null>("svg");
  if (!name || !ext) {
    return <span className="inline-flex items-center rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-ink/60">{label}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/payment-logos/${name}.${ext}`}
      alt={label}
      className={`w-auto object-contain ${className}`}
      onError={() => setExt(ext === "svg" ? "png" : null)}
    />
  );
}

export function LogoRow({ items, className }: { items: { name: string; label: string }[]; className?: string }) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {items.map((i) => <PayLogo key={i.name} name={i.name} label={i.label} />)}
    </span>
  );
}
