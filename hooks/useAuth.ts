import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface SendOtpResponse {
  success: true;
  message: string;
  expiresAt: string;
  devOtpHint?: string;
}

interface VerifyOtpResponse {
  success: true;
  accessToken: string;
  isNewUser: boolean;
  user: {
    id: string;
    phone: string;
    name: string | null;
    email: string | null;
    role: "CUSTOMER" | "ADMIN";
    isProfileComplete: boolean;
  };
}

/** Fires automatically once the phone field has exactly 10 digits. */
export function useSendOtp() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const { data } = await api.post<SendOtpResponse>("/auth/otp/send", { phone });
      return data;
    },
  });
}

/** Fires automatically once all 4 OTP digits are filled. */
export function useVerifyOtp() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const { data } = await api.post<VerifyOtpResponse>("/auth/otp/verify", { phone, code });
      return data;
    },
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
    },
  });
}

export function useCompleteProfile() {
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: async (input: { name: string; email?: string }) => {
      const { data } = await api.post("/auth/complete-profile", input);
      return data as { success: true; user: VerifyOtpResponse["user"] };
    },
    onSuccess: (data) => {
      if (accessToken) setSession(accessToken, data.user);
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: async () => api.post("/auth/logout"),
    onSuccess: () => clearSession(),
  });
}
