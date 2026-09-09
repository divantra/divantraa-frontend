import type { AxiosError } from "axios";

/**
 * Extracts a human-readable message from an Axios error.
 * Falls back to the error message if no API response body is available.
 */
export function getAxiosErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError?.response?.data?.message ?? axiosError?.message ?? fallback;
}

/**
 * Returns the HTTP status code from an Axios error, or undefined.
 */
export function getAxiosErrorStatus(error: unknown): number | undefined {
  return (error as AxiosError)?.response?.status;
}
