"use client";

import React, {
  useState,
  useRef,
  useEffect,
} from "react";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";

import {
  LayoutGrid,
  Droplet,
  Wheat,
  Package,
  Leaf,
  FlameKindling,
  Star,
  ShoppingCart,
  Minus,
  Plus,
  Circle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { api } from "@/lib/api";
import {
  useCartStore,
  type CartLine,
} from "@/store/useCartStore";

import type {
  Product,
  Category,
} from "@/types/product";

import {
  getDefaultVariant,
} from "@/types/product";

/* ============================================================
   CATEGORY ICONS
   ============================================================ */

function getCategoryIcon(
  slug: string,
  size = 34
) {
  const props = {
    size,
    strokeWidth: 1.5,
    className: "text-forest",
  } as const;

  if (slug.includes("ghee")) {
    return <Droplet {...props} />;
  }

  if (slug.includes("oil")) {
    return <Droplet {...props} />;
  }

  if (
    slug.includes("atta") ||
    slug.includes("flour") ||
    slug.includes("grain")
  ) {
    return <Wheat {...props} />;
  }

  if (slug.includes("combo")) {
    return <Package {...props} />;
  }

  if (
    slug.includes("superfood") ||
    slug.includes("herb")
  ) {
    return <Leaf {...props} />;
  }

  if (
    slug.includes("spice") ||
    slug.includes("masala")
  ) {
    return <FlameKindling {...props} />;
  }

  return <Star {...props} />;
}

const MAX_CATEGORY_TABS = 5;

/* ============================================================
   CATEGORY PRODUCT SLIDER
   ============================================================ */

export function CategoryProductSlider() {
  const [activeSlug, setActiveSlug] =
    useState<string | null>(null);

  const sliderRef =
    useRef<HTMLDivElement>(null);

  const [canPrev, setCanPrev] =
    useState(false);

  const [canNext, setCanNext] =
    useState(false);

  /* ============================================================
     CATEGORIES
     ============================================================ */

  const {
    data: categories = [],
  } = useQuery<Category[]>({
    queryKey: ["active-categories"],

    queryFn: () =>
      api
        .get("/categories/active")
        .then((r) => r.data.data),

    staleTime: 5 * 60 * 1000,
  });

  /* ============================================================
     ALL PRODUCTS
     ============================================================ */

  const {
    data: allProducts = [],
  } = useQuery<Product[]>({
    queryKey: [
      "products-for-category-tabs",
    ],

    queryFn: () =>
      api
        .get<{ data: Product[] }>(
          "/products",
          {
            params: {
              limit: 50,
            },
          }
        )
        .then((r) => r.data.data),

    staleTime: 5 * 60 * 1000,
  });

  /* ============================================================
     PRODUCTS
     ============================================================ */

  const {
    data: products = [],
    isLoading,
  } = useQuery<Product[]>({
    queryKey: [
      "products-slider",
      activeSlug,
    ],

    queryFn: () =>
      api
        .get<{ data: Product[] }>(
          "/products",
          {
            params: {
              ...(activeSlug
                ? {
                    category:
                      activeSlug,
                  }
                : {}),

              limit: 50,
            },
          }
        )
        .then((r) => r.data.data),

    staleTime: 5 * 60 * 1000,
  });

  /* ============================================================
     ACTIVE CATEGORIES
     ============================================================ */

  const activeCategoryIds =
    new Set(
      allProducts
        .filter((product) =>
          product.variants?.some(
            (variant) =>
              variant.isActive
          )
        )
        .map(
          (product) =>
            product.category?.id
        )
        .filter(Boolean)
    );

  const visibleCategories =
    categories
      .filter((category) =>
        activeCategoryIds.has(
          category.id
        )
      )
      .slice(
        0,
        MAX_CATEGORY_TABS
      );

  /* ============================================================
     UPDATE SLIDER BUTTON STATE
     ============================================================ */

  const updateSliderButtons =
    () => {
      const slider =
        sliderRef.current;

      if (!slider) return;

      const maxScroll =
        slider.scrollWidth -
        slider.clientWidth;

      setCanPrev(
        slider.scrollLeft > 5
      );

      setCanNext(
        slider.scrollLeft <
          maxScroll - 5
      );
    };

  /* ============================================================
     RESET SLIDER
     ============================================================ */

  useEffect(() => {
    const slider =
      sliderRef.current;

    if (!slider) return;

    slider.scrollTo({
      left: 0,
      behavior: "auto",
    });

    setTimeout(
      updateSliderButtons,
      50
    );
  }, [activeSlug, products]);

  /* ============================================================
     LISTEN TO SCROLL
     ============================================================ */

  useEffect(() => {
    const slider =
      sliderRef.current;

    if (!slider) return;

    updateSliderButtons();

    slider.addEventListener(
      "scroll",
      updateSliderButtons,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      updateSliderButtons
    );

    return () => {
      slider.removeEventListener(
        "scroll",
        updateSliderButtons
      );

      window.removeEventListener(
        "resize",
        updateSliderButtons
      );
    };
  }, [products]);

  /* ============================================================
     NEXT
     ============================================================ */

  const handleNext = () => {
    const slider =
      sliderRef.current;

    if (!slider) return;

    const card =
      slider.querySelector(
        "[data-product-card]"
      ) as HTMLElement | null;

    if (!card) return;

    const cardWidth =
      card.offsetWidth;

    const gap = 16;

    /*
      Move approximately 4 cards
      on desktop.
    */

    slider.scrollBy({
      left:
        (cardWidth + gap) * 4,
      behavior: "smooth",
    });
  };

  /* ============================================================
     PREVIOUS
     ============================================================ */

  const handlePrevious = () => {
    const slider =
      sliderRef.current;

    if (!slider) return;

    const card =
      slider.querySelector(
        "[data-product-card]"
      ) as HTMLElement | null;

    if (!card) return;

    const cardWidth =
      card.offsetWidth;

    const gap = 16;

    slider.scrollBy({
      left:
        -(
          (cardWidth + gap) *
          4
        ),
      behavior: "smooth",
    });
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <section className="w-full overflow-hidden bg-cream/30 pt-0 pb-8">

      {/* ========================================================
          CATEGORY TABS
          ======================================================== */}

      <div
        className="
          w-full
          border-b
          border-ink/8
          bg-white
        "
      >

        <div
          className="flex
            w-full
            items-start
            justify-center
            gap-3
            overflow-x-auto
            px-4
            py-3
            md:gap-5
          "
          style={{
            scrollbarWidth:
              "none",
            msOverflowStyle:
              "none",
          }}
        >

          {/* ALL */}

          <CategoryTab
            label="All"
            icon={
              <LayoutGrid
                size={34}
                strokeWidth={1.5}
                className="text-forest"
              />
            }
            active={
              activeSlug === null
            }
            onClick={() =>
              setActiveSlug(null)
            }
          />

          {/* CATEGORIES */}

          {visibleCategories.map(
            (category) => (
              <CategoryTab
                key={category.id}
                label={
                  category.name
                }
                icon={getCategoryIcon(
                  category.slug,
                  34
                )}
                active={
                  activeSlug ===
                  category.slug
                }
                onClick={() =>
                  setActiveSlug(
                    category.slug
                  )
                }
              />
            )
          )}

        </div>

      </div>

      {/* ========================================================
          PRODUCT SECTION
          ======================================================== */}

      <div
        className="
          relative
          mt-5
          w-full
        "
      >

        {/* ======================================================
            PREVIOUS BUTTON
            ====================================================== */}

        <button
          type="button"
          onClick={
            handlePrevious
          }
          disabled={!canPrev}
          aria-label="Previous products"
          className={`
            absolute
            left-3
            top-1/2
            z-50
            hidden
            h-11
            w-11
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-ink/10
            bg-white
            shadow-lg
            transition-all
            lg:flex
            ${
              canPrev
                ? "cursor-pointer text-forest hover:scale-105 hover:shadow-xl"
                : "cursor-default opacity-0"
            }
          `}
        >
          <ChevronLeft
            size={23}
            strokeWidth={2.5}
          />
        </button>

        {/* ======================================================
            NEXT BUTTON
            ====================================================== */}

        <button
          type="button"
          onClick={
            handleNext
          }
          disabled={!canNext}
          aria-label="Next products"
          className={`
            absolute
            right-3
            top-1/2
            z-50
            hidden
            h-11
            w-11
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            border
            border-ink/10
            bg-white
            shadow-lg
            transition-all
            lg:flex
            ${
              canNext
                ? "cursor-pointer text-forest hover:scale-105 hover:shadow-xl"
                : "cursor-default opacity-0"
            }
          `}
        >
          <ChevronRight
            size={23}
            strokeWidth={2.5}
          />
        </button>

        {/* ======================================================
            LOADING
            ====================================================== */}

        {isLoading ? (
          <div
            className="
              py-12
              text-center
              text-sm
              text-ink/40
            "
          >
            Loading products…
          </div>
        ) : products.filter(
            (product) =>
              getDefaultVariant(
                product
              )
          ).length === 0 ? (

          /* ====================================================
             EMPTY
             ==================================================== */

          <div
            className="
              py-12
              text-center
              text-sm
              text-ink/40
            "
          >
            No products in this
            category yet.
          </div>

        ) : (

          /* ====================================================
             HORIZONTAL PRODUCT SLIDER
             ==================================================== */

          <div
            ref={sliderRef}
            className="
              flex
              w-full
              gap-4
              overflow-x-auto
              overflow-y-hidden
              px-0
              pb-4
              scroll-smooth
              snap-x
              snap-mandatory
            "
            style={{
              scrollbarWidth:
                "none",
              msOverflowStyle:
                "none",
            }}
          >

            {products.map(
              (product) => {
                const variant =
                  getDefaultVariant(
                    product
                  );

                if (!variant) {
                  return null;
                }

                /* =================================================
                   IMAGE
                   ================================================= */

                const cardImage =
                  variant
                    .resolvedImages?.[0] ??
                  variant
                    .images?.[0] ??
                  product
                    .images?.[0] ??
                  "";

                /* =================================================
                   BADGE
                   ================================================= */

                const badge =
                  product
                    .badges?.[0];

                return (
                  <div
                    key={product.id}
                    data-product-card
                    className="
                      group
                      relative
                      flex
                      min-w-0
                      flex-none
                      snap-start
                      flex-col
                      overflow-hidden
                      rounded-[16px]
                      border
                      border-ink/10
                      bg-white
                      shadow-sm
                      transition-all
                      duration-200

                      w-[calc((100vw-16px)/2)]

                      sm:w-[calc((100vw-32px)/3)]

                      lg:w-[calc((100vw-48px)/4)]

                      xl:w-[calc((100vw-64px)/4)]

                      hover:-translate-y-0.5
                      hover:shadow-md
                    "
                  >

                    {/* =================================================
                        BADGE
                        ================================================= */}

                    {badge && (
                      <div
                        className="
                          absolute
                          right-0
                          top-0
                          z-30
                          flex
                          max-w-[75%]
                          items-center
                          gap-1.5
                          rounded-bl-[16px]
                          bg-gold
                          px-3
                          py-2.5
                          text-white
                        "
                      >

                        <Star
                          size={16}
                          fill="currentColor"
                          strokeWidth={
                            1.5
                          }
                        />

                        <span
                          className="
                            truncate
                            text-[11px]
                            font-bold
                            sm:text-xs
                          "
                        >
                          {badge}
                        </span>

                      </div>
                    )}

                    {/* =================================================
                        IMAGE
                        ================================================= */}

                    <Link
                      href={`/products/${product.slug}`}
                      className="block w-full"
                    >

                      <div
                        className="
                          relative
                          h-[230px]
                          w-full
                          overflow-hidden
                          bg-white
                          sm:h-[240px]
                          lg:h-[245px]
                        "
                      >

                        {cardImage ? (
                          <Image
                            src={
                              cardImage
                            }
                            alt={
                              product.title
                            }
                            fill
                            sizes="
                              25vw
                            "
                            className="
                              object-cover
                              p-0
                              transition-transform
                              duration-300
                              group-hover:scale-[1.03]
                            "
                          />
                        ) : (
                          <div
                            className="
                              flex
                              h-full
                              w-full
                              items-center
                              justify-center
                              text-xs
                              text-ink/30
                            "
                          >
                            No image
                          </div>
                        )}

                      </div>

                    </Link>

                    {/* =================================================
                        ADD BUTTON
                        ================================================= */}

                    <div
                      className="
                        absolute
                        right-3
                        top-[43%]
                        z-10
                      "
                    >
                      <AddToCartButton
                        item={{
                          productId:
                            product.id,

                          variantId:
                            variant.id,

                          title:
                            product.title,

                          variantTitle:
                            variant.title,

                          slug:
                            product.slug,

                          price:
                            Number(
                              variant.price
                            ),

                          image:
                            cardImage,
                        }}
                      />
                    </div>

                    {/* =================================================
                        PRODUCT DETAILS
                        ================================================= */}

                    <div
                      className="
                        flex
                        flex-1
                        flex-col
                        px-4
                        pb-4
                        pt-3
                      "
                    >

                      <Link
                        href={`/products/${product.slug}`}
                      >

                        {/* TITLE */}

                        <h3
                          className="
                            min-h-[40px]
                            pr-10
                            text-[15px]
                            font-semibold
                            leading-[1.3]
                            text-ink
                            sm:text-[16px]
                          "
                        >
                          {
                            product.title
                          }
                        </h3>

                        {/* VARIANT */}

                        {Object.values(
                          variant.options
                        ).length >
                          0 && (
                          <p
                            className="
                              mt-1
                              truncate
                              text-[11px]
                              text-ink/40
                            "
                          >
                            {Object.values(
                              variant.options
                            ).join(
                              " · "
                            )}
                          </p>
                        )}

                        {/* RATING */}

                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            gap-1.5
                          "
                        >

                          <Star
                            size={16}
                            fill="currentColor"
                            className="
                              shrink-0
                              text-gold
                            "
                            strokeWidth={
                              1.5
                            }
                          />

                          <span
                            className="
                              text-[12px]
                              font-semibold
                              text-ink
                            "
                          >
                            4.8
                          </span>

                          <span
                            className="
                              truncate
                              text-[11px]
                              text-ink/50
                            "
                          >
                            (1275 reviews)
                          </span>

                        </div>

                        {/* PRICE */}

                        <div
                          className="
                            mt-2
                            flex
                            items-baseline
                            gap-2
                          "
                        >

                          <span
                            className="
                              text-[23px]
                              font-bold
                              leading-none
                              text-ink
                            "
                          >
                            ₹
                            {
                              variant.price
                            }
                          </span>

                          {variant.compareAtPrice && (
                            <span
                              className="
                                text-[12px]
                                text-ink/40
                                line-through
                              "
                            >
                              ₹
                              {
                                variant.compareAtPrice
                              }
                            </span>
                          )}

                        </div>

                        {/* OFFER */}

                        <div
                          className="
                            mt-3
                            flex
                            min-h-[34px]
                            items-center
                            gap-1
                            rounded-lg
                            bg-leaf/10
                            px-2
                            py-1.5
                          "
                        >

                          <span
                            className="
                              text-[12px]
                            "
                          >
                            🏷️
                          </span>

                          <span
                            className="
                              text-[10px]
                              font-bold
                              text-forest
                              sm:text-[11px]
                            "
                          >
                            Best Price
                          </span>

                          <span
                            className="
                              text-[10px]
                              font-semibold
                              text-forest
                              sm:text-[11px]
                            "
                          >
                            ₹
                            {Math.round(
                              Number(
                                variant.price
                              ) *
                                0.85
                            )}
                          </span>

                          <span
                            className="
                              hidden
                              text-[10px]
                              text-forest
                              sm:inline
                            "
                          >
                            with PURE15
                          </span>

                        </div>

                      </Link>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </section>
  );
}

/* ============================================================
   CATEGORY TAB
   ============================================================ */

function CategoryTab({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        group
        flex
        min-w-[50px]
        shrink-0
        flex-col
        items-center
        gap-1
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          transition-opacity
          group-hover:opacity-75
        "
      >
        {icon}
      </div>

      <div
        className="
          flex
          flex-col
          items-center
          gap-1
        "
      >
        <span
          className={`whitespace-nowrap text-[12px] transition-colors ${
            active
              ? "font-semibold text-forest"
              : "font-medium text-ink/50 group-hover:text-forest"
          }`}
        >
          {label}
        </span>

        {/* ACTIVE UNDERLINE */}
        <span
          className={`h-[3px] w-[90px] rounded-full ${
            active
              ? "bg-forest"
              : "bg-transparent"
          }`}
        />
      </div>
    </button>
  );
}

/* ============================================================
   ADD TO CART
   ============================================================ */

function AddToCartButton({
  item,
}: {
  item: Omit<CartLine, "quantity">;
}) {
  const [
    isClient,
    setIsClient,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    added,
    setAdded,
  ] = useState(false);

  const {
    addItem,
    updateQuantity,
    getItemQuantity,
  } = useCartStore();

  /* ============================================================
     CLIENT
     ============================================================ */

  useEffect(() => {
    setIsClient(true);
  }, []);

  const cartQuantity =
    isClient
      ? getItemQuantity(
          item.variantId
        )
      : 0;

  /* ============================================================
     ADD
     ============================================================ */

  const handleAdd = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);

    setTimeout(() => {
      addItem(item, 1);

      setLoading(false);
      setAdded(true);

      setTimeout(() => {
        setAdded(false);
      }, 1500);
    }, 350);
  };

  /* ============================================================
     QUANTITY
     ============================================================ */

  if (cartQuantity > 0) {
    return (
      <div
        className="
          flex
          h-[40px]
          min-w-[88px]
          items-center
          justify-between
          overflow-hidden
          rounded-[20px]
          bg-forest
          shadow-md
        "
      >

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            updateQuantity(
              item.variantId,
              cartQuantity - 1
            );
          }}
          className="
            flex
            h-full
            w-7
            items-center
            justify-center
            text-white
            hover:bg-white/10
          "
          aria-label="Decrease quantity"
        >
          <Minus
            size={14}
            strokeWidth={2.5}
          />
        </button>

        <span
          className="
            text-xs
            font-bold
            text-white
          "
        >
          {cartQuantity}
        </span>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            updateQuantity(
              item.variantId,
              cartQuantity + 1
            );
          }}
          className="
            flex
            h-full
            w-7
            items-center
            justify-center
            text-white
            hover:bg-white/10
          "
          aria-label="Increase quantity"
        >
          <Plus
            size={14}
            strokeWidth={2.5}
          />
        </button>

      </div>
    );
  }

  /* ============================================================
     ADD BUTTON
     ============================================================ */

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="
        flex
        h-[40px]
        min-w-[88px]
        items-center
        justify-center
        gap-1.5
        rounded-[20px]
        bg-forest
        px-3.5
        text-xs
        font-semibold
        text-white
        shadow-md
        transition-all
        duration-200
        hover:bg-leaf
        hover:shadow-lg
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >

      {loading ? (
        <Circle
          className="
            h-4
            w-4
            animate-spin
            text-white
          "
        />
      ) : added ? (
        <span>
          ✓ Added
        </span>
      ) : (
        <>
          <span>
            ADD
          </span>

          <ShoppingCart
            size={17}
            strokeWidth={2}
          />
        </>
      )}

    </button>
  );
}