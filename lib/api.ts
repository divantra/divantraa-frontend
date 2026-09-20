import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { useUiStore } from "@/store/useUiStore";

/**
 * Base URL strategy:
 *  • Server-side (SSR / API routes / server components): use the internal
 *    localhost URL directly — backend and Next.js are on the same machine.
 *    Read from NEXT_PUBLIC_API_URL (no NEXT_PUBLIC_ prefix, never sent to browser).
 *  • Client-side (browser): use a relative path.  Nginx routes /api/ straight
 *    to port 5000 — the browser never needs to know about localhost:5000.
 */
const baseURL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1")
    : "/api/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

// Attach the in-memory access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Refresh tokens are single-use (rotated on every refresh), so two refresh calls at
 * the same time make the second one fail and sign the user out. Everything that needs
 * a fresh session — the initial page load AND the 401 interceptor — shares this one
 * in-flight request.
 */
let refreshPromise: Promise<void> | null = null;

export function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setSession(data.accessToken, data.user);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// On a 401, refresh the access token once (shared, see above), then retry the request.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Never try to refresh when the failing request IS the refresh endpoint —
    // that would create an infinite retry loop.
    const isRefreshCall = originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      try {
        await refreshSession();
        return api(originalRequest);
      } catch (refreshError) {
        // Sessions last 30 minutes of inactivity. If a signed-in user hits this,
        // tell them why they were signed out instead of failing silently.
        const wasSignedIn = !!useAuthStore.getState().user;
        useAuthStore.getState().clearSession();
        if (wasSignedIn && typeof window !== "undefined") {
          useUiStore.getState().openLoginModal("Your session expired after 30 minutes of inactivity. Please sign in again.");
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
