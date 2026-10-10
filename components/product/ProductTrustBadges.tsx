import { getImageUrl } from "@/lib/image.utils";
import Image from "next/image";

interface ProductTrustBadgesProps {
  /** Free shipping minimum order threshold (defaults to 499) */
  freeShippingThreshold?: number;
  /** Custom container class */
  className?: string;
  /** Layout mode: "compact" for right column/sidebar, "full" for full width section */
  layout?: "compact" | "full";
  /** Whether to render as an enclosed card or clean open strip */
  variant?: "card" | "plain";
}

export function ProductTrustBadges({
  freeShippingThreshold = 499,
  className,
  layout = "compact",
  variant = "card",
}: ProductTrustBadgesProps) {
  const items = [
    {
      id: "free-shipping",
      icon: getImageUrl("public/trust-badges/free-shipping.png"),
      alt: "Free Shipping",
      width: 210,
      height: 110,
      line1: "Free Shipping on",
      line2: `Orders > ₹${freeShippingThreshold}`,
      fullLine2: `Orders Above ₹${freeShippingThreshold}`,
    },
    {
      id: "customer-support",
      icon: getImageUrl("public/trust-badges/customer-support.png"),
      alt: "360° Customer Support",
      width: 116,
      height: 120,
      line1: "360° Customer",
      line2: "Support",
      fullLine2: "Support",
    },
    {
      id: "refund-100",
      icon: getImageUrl("public/trust-badges/easy-returns.png"),
      alt: "100% Full Refund Guarantee",
      width: 118,
      height: 118,
      line1: "100%",
      line2: "Refund",
      fullLine2: "Full Refund",
    },
    {
      id: "quality-checks",
      icon: getImageUrl("public/trust-badges/quality-checks.png"),
      alt: "40+ Quality Checks",
      width: 120,
      height: 118,
      line1: "40+ Quality",
      line2: "Checks",
      fullLine2: "Checks",
    },
  ];

  const isCompact = layout === "compact";

  const content = (
    <div
      className={
        isCompact
          ? "grid grid-cols-4 gap-1.5 sm:gap-2.5 items-start"
          : "grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 items-start"
      }
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col items-center text-center group transition-transform hover:-translate-y-0.5"
        >
          {/* Badge Icon */}
          <div
            className={
              isCompact
                ? "h-10 sm:h-12 w-full flex items-center justify-center mb-1.5 sm:mb-2"
                : "h-16 sm:h-20 w-full flex items-center justify-center mb-3 sm:mb-3.5"
            }
          >
            <Image
              src={item.icon}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className={
                isCompact
                  ? "max-h-10 sm:max-h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                  : "max-h-16 sm:max-h-20 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              }
              priority={false}
            />
          </div>

          {/* Badge Label */}
          <p
            className={
              isCompact
                ? "text-[#225b4a] font-medium text-[10px] sm:text-[11px] leading-tight tracking-tight text-center"
                : "text-[#225b4a] font-medium text-xs sm:text-sm md:text-base leading-snug tracking-tight text-center"
            }
          >
            <span>{item.line1}</span>
            <br />
            <span>{isCompact ? item.line2 : item.fullLine2}</span>
          </p>
        </div>
      ))}
    </div>
  );

  const containerClass =
    className ??
    (isCompact
      ? "my-6"
      : "max-w-7xl mx-auto px-4 sm:px-6 pb-16");

  return (
    <section aria-label="Customer Guarantees and Trust Badges" className={containerClass}>
      {variant === "card" ? (
        <div
          className={
            isCompact
              ? "bg-white/95 p-3.5 sm:p-4 shadow-xs"
              : "bg-white/95 py-8 sm:py-10 px-4 sm:px-8 shadow-xs"
          }
        >
          {content}
        </div>
      ) : (
        <div className={isCompact ? "py-2" : "py-6"}>{content}</div>
      )}
    </section>
  );
}

export default ProductTrustBadges;
