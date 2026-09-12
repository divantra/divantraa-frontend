import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/store/useAuthStore";

// ── Shared response types ──────────────────────────────────────

interface OtpResponse {
  success: true;
  message: string;
  expiresAt: string;
  /** Dev-mode hint only — never shown to end users */
  devHint?: string;
}

interface VerifyOtpResponse {
  success: true;
  accessToken: string;
  isNewUser: boolean;
  user: AuthUser;
}

// ── Auth hooks ─────────────────────────────────────────────────

/**
 * POST /auth/otp/send
 * Fires automatically once the phone field has exactly 10 digits.
 * Backend accepts { phone } (10-digit) and converts to E164 internally.
 */
export function useSendOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const { data } = await api.post<OtpResponse>("/auth/otp/send", { phone });
      return data;
    },
  });
}

/**
 * POST /auth/otp/resend
 * Fires when the user explicitly taps "Resend code" after the timer expires.
 * Rate-limited separately from /otp/send; returns 429 when resend limit hit.
 */
export function useResendOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const { data } = await api.post<OtpResponse>("/auth/otp/resend", { phone });
      return data;
    },
  });
}

/**
 * POST /auth/otp/verify
 * Fires automatically once all 6 OTP digits are filled.
 * On success, stores the access token + user in memory AND marks the store
 * as hydrated — we already have fresh session data, so there is no reason to
 * wait for AuthProvider's independent /auth/refresh call to complete first.
 * Without this, navigating to /account immediately after login shows a
 * skeleton until the unrelated refresh call finally resolves.
 */
export function useVerifyOtp() {
  const setSession  = useAuthStore((s) => s.setSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const { data } = await api.post<VerifyOtpResponse>("/auth/otp/verify", { phone, code });
      return data;
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
      setHydrated(true); // session is fresh — no need to wait for AuthProvider's refresh
    },
  });
}

/**
 * POST /auth/complete-profile
 * Auth required. Called once for new users right after first OTP verification.
 * Updates the in-memory user with the completed profile.
 */
export function useCompleteProfile() {
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: async (input: { name: string; email?: string }) => {
      const { data } = await api.post<{ success: true; user: AuthUser }>(
        "/auth/complete-profile",
        input
      );
      return data;
    },
    onSuccess: (data) => {
      if (accessToken) setSession(accessToken, data.user);
    },
  });
}

// ── User / account hooks ───────────────────────────────────────

/**
 * PATCH /user/profile
 * Updates name and/or email. Pass email: null to clear it.
 * Updates the in-memory user on success.
 */
export function useUpdateProfile() {
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: async (input: { name?: string; email?: string | null }) => {
      const { data } = await api.patch<{ success: true; user: AuthUser }>(
        "/user/profile",
        input
      );
      return data;
    },
    onSuccess: (data) => {
      if (accessToken) setSession(accessToken, data.user);
    },
  });
}

/**
 * DELETE /user/account
 * Soft-deletes the account and revokes all sessions.
 * Clears the in-memory session on success.
 */
export function useDeactivateAccount() {
  const clearSession = useAuthStore((s) => s.clearSession);

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ success: true; message: string }>(
        "/user/account",
        { data: { confirm: true } }
      );
      return data;
    },
    onSuccess: () => clearSession(),
  });
}

/**
 * POST /auth/logout
 * Revokes the refresh cookie and clears the in-memory session.
 */
export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: async () => api.post("/auth/logout"),
    onSuccess: () => clearSession(),
  });
}
