import { create } from "zustand";

interface UiState {
  isMobileMenuOpen: boolean;
  isLoginModalOpen: boolean;
  loginNotice: string | null;          // e.g. "Your session expired"
  openLoginModal: (notice?: string) => void;
  addOnsForProductId: string | null;   // non-null = add-ons drawer open for this product
  openAddOns: (productId: string) => void;
  closeAddOns: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  closeLoginModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  isLoginModalOpen: false,
  loginNotice: null,
  addOnsForProductId: null,
  openAddOns: (productId) => set({ addOnsForProductId: productId }),
  closeAddOns: () => set({ addOnsForProductId: null }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openLoginModal: (notice) => set({ isLoginModalOpen: true, loginNotice: typeof notice === "string" ? notice : null }),
  closeLoginModal: () => set({ isLoginModalOpen: false, loginNotice: null }),
}));
