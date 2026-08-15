import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartLine {
  productId: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  isOpen: boolean;
  items: CartLine[];
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  itemCount: () => number;
}

/**
 * Client-side cart mirror used for instant UI feedback (drawer, badge count).
 * Persisted to localStorage for guests; synced to the server cart via
 * /api/v1/cart once the user is authenticated (see hooks/useCartSync.ts).
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      items: [],
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { ...item, quantity }], isOpen: true };
        }),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        })),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clearCart: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "anveshan-cart" }
  )
);
