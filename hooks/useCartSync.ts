"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image.utils";

/**
 * Synchronises the local Zustand cart with the server cart.
 *
 * On login:
 *   1. Push every local item to POST /cart/items (upsert — safe to call multiple times).
 *   2. Then pull the server cart and replace local state with the enriched data.
 *
 * This ensures the server cart always reflects what the user sees, so COD order
 * creation (which reads from the server cart) works correctly.
 */
export function useCartSync() {
  const user        = useAuthStore((s) => s.user);
  const isHydrated  = useAuthStore((s) => s.isHydrated);
  const localItems  = useCartStore((s) => s.items);
  const clearLocal  = useCartStore((s) => s.clearCart);
  const addItem     = useCartStore((s) => s.addItem);

  // Track last user id to re-run sync when the user changes (login/logout)
  const lastUserId  = useRef<string | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      lastUserId.current = null;
      return;
    }
    // Already synced for this session
    if (lastUserId.current === user.id) return;
    lastUserId.current = user.id;

    async function sync() {
      try {
        // 1. Clear server cart and re-add local items so quantities match exactly.
        //    POST /cart/items increments, so we delete first to take the create path.
        if (localItems.length > 0) {
          await api.delete("/cart").catch(() => {});
          for (const item of localItems) {
            await api.post("/cart/items", { variantId: item.variantId, quantity: item.quantity })
              .catch(() => { /* ignore individual item errors (out-of-stock, deleted) */ });
          }
        }

        // 2. Pull the authoritative server cart and rebuild local state
        const { data } = await api.get("/cart");
        const serverItems = data.data?.items ?? [];

        clearLocal();
        for (const si of serverItems) {
          const image = si.resolvedImages?.[0]
            ? getImageUrl(si.resolvedImages[0])
            : si.product?.images?.[0]
              ? getImageUrl(si.product.images[0])
              : "";

          addItem(
            {
              productId:    si.productId,
              variantId:    si.variantId,
              title:        si.product?.title ?? "",
              variantTitle: si.variant?.title ?? "",
              slug:         si.product?.slug ?? "",
              price:        Number(si.variant?.price ?? 0),
              compareAtPrice: si.variant?.compareAtPrice
                ? Number(si.variant.compareAtPrice)
                : undefined,
              image,
            },
            si.quantity
          );
        }
      } catch {
        // Sync failure is non-fatal — user can still browse
      }
    }

    sync();
  }, [user, isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps
}
