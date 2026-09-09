import { create } from "zustand";

/**
 * AuthUser matches the SafeUser shape returned by the backend:
 *   { id, mobile, name, email, role, status, isProfileComplete, ... }
 * `mobile` is E164 format: +91XXXXXXXXXX
 */
export interface AuthUser {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: "CUSTOMER" | "ADMIN" | "STAFF" | "VENDOR";
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  isProfileComplete: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isHydrated: boolean; // true once we've attempted the initial /auth/refresh
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (v: boolean) => void;
}

/**
 * Access token + user profile live in memory only (never localStorage) —
 * the httpOnly refresh cookie is what actually persists the session across
 * tabs/reloads. On app load, AuthProvider calls POST /auth/refresh to
 * silently restore accessToken + user into this store.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrated: (v) => set({ isHydrated: v }),
}));
