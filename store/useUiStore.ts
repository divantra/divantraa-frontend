import { create } from "zustand";

interface UiState {
  isMobileMenuOpen: boolean;
  isLoginModalOpen: boolean;
  addOnsForProductId: string | null;   // non-null = add-ons drawer open for this product
  openAddOns: (productId: string) => void;
  closeAddOns: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  isLoginModalOpen: false,
  addOnsForProductId: null,
  openAddOns: (productId) => set({ addOnsForProductId: productId }),
  closeAddOns: () => set({ addOnsForProductId: null }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
