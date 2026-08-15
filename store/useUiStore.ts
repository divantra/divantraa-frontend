import { create } from "zustand";

interface UiState {
  isMobileMenuOpen: boolean;
  isLoginModalOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  isLoginModalOpen: false,
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));
