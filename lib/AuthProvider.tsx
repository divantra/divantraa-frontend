"use client";

import { useEffect } from "react";
import { refreshSession } from "./api";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartSync } from "@/hooks/useCartSync";

/**
 * On first mount, silently attempts to restore the session using the
 * httpOnly refresh cookie (if present) so a returning, already-logged-in
 * user doesn't have to go through the OTP flow again on every visit.
 * Also runs cart sync after session is restored.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useCartSync();

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        // Shared with the 401 interceptor so only ONE refresh request is ever in flight.
        await refreshSession();
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
