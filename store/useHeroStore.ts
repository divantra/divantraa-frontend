import { create } from "zustand";

interface HeroStore {
  /** If true, the layout hero banner/slider is globally hidden for the current page */
  isHeroDisabled: boolean;
  setHeroDisabled: (disabled: boolean) => void;
}

export const useHeroStore = create<HeroStore>((set) => ({
  isHeroDisabled: false,
  setHeroDisabled: (isHeroDisabled) => set({ isHeroDisabled }),
}));
