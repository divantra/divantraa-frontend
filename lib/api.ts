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

// On a 401, try refreshing the access token once, then retry the request.
let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Never try to refresh when the failing request IS the refresh endpoint —
    // that would create an infinite retry loop.
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Wait for the in-flight refresh to finish, then retry
        await new Promise<void>((resolve) => pendingQueue.push(resolve));
        return api(originalRequest);
      }

      isRefreshing = true;
      try {
        const { data } = await api.post("/auth/refresh");
        useAuthStore.getState().setSession(data.accessToken, data.user);
        pendingQueue.forEach((resolve) => resolve());
        pendingQueue = [];
        return api(originalRequest);
      } catch (refreshError) {
        // Sessions last 30 minutes of inactivity. If a signed-in user hits this,
        // tell them why they were signed out instead of failing silently.
        const wasSignedIn = !!useAuthStore.getState().user;
        useAuthStore.getState().clearSession();
        if (wasSignedIn && typeof window !== "undefined") {
          useUiStore.getState().openLoginModal("Your session expired after 30 minutes of inactivity. Please sign in again.");
        }
        pendingQueue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
