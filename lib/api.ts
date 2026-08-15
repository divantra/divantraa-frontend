import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1",
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

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        useAuthStore.getState().clearSession();
        pendingQueue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
