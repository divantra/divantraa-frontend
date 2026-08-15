"use client";

import { useEffect } from "react";
import { api } from "./api";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * On first mount, silently attempts to restore the session using the
 * httpOnly refresh cookie (if present) so a returning, already-logged-in
 * user doesn't have to go through the OTP flow again on every visit.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { data } = await api.post("/auth/refresh");
        if (!cancelled) setSession(data.accessToken, data.user);
      } catch {
        // No valid session — user will see the logged-out state, that's fine.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
