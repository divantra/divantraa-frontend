import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId:    string;
  variantId:    string;          // the purchasable SKU — cart keyed on this
  title:        string;          // product title
  variantTitle: string;          // e.g. "500 ml Glass Jar"
  slug:         string;
  price:        number;
  image:        string;
  quantity:     number;
}

interface CartState {
  isOpen: boolean;
  items:  CartLine[];
  openCart:        () => void;
  closeCart:       () => void;
  addItem:         (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity:  (variantId: string, quantity: number) => void;
  getItemQuantity: (variantId: string) => number;
  removeItem:      (variantId: string) => void;
  clearCart:       () => void;
  subtotal:        () => number;
  itemCount:       () => number;
  totalPrice:      () => number;
}

/**
 * Client-side cart mirror used for instant UI feedback (drawer, badge count).
 * Keyed on variantId so the same product in different sizes are separate lines.
 * Persisted to localStorage for guests; synced to the server cart via
 * /api/v1/cart once the user is authenticated (see hooks/useCartSync.ts).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      items:  [],

      openCart:  () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),

      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity } : i
                ),
        })),

      getItemQuantity: (variantId) => {
        const item = get().items.find((i) => i.variantId === variantId);
        return item?.quantity ?? 0;
      },

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      clearCart:  () => set({ items: [] }),
      subtotal:   () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      itemCount:  () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    { name: "divantraa-cart" }
  )
);
