// src/lib/queryClient.ts
import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { QueryClient, type QueryFunction } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to all requests except login
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.url !== "/auth/login") {
    const token = localStorage.getItem("authToken"); 
    if (token) {
      if (config.headers) {
        config.headers.set?.("Authorization", `Bearer ${token}`); // use set() for AxiosHeaders
      }
    }
  }
  return config;
});


// Centralized error handler
async function handleAxiosError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // Optionally redirect to login
      // window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    // Prefer server-provided message when available
    const data = error.response?.data as any;
    const serverMessage =
      (typeof data === "string" && data) ||
      (typeof data === "object" && (data?.message || data?.error || data?.detail)) ||
      undefined;

    throw new Error(serverMessage || `${status}: ${error.response?.statusText || error.message}`);
  }
  throw error;
}

// Generic API request
export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    const response = await axiosInstance.request<T>({ method, url, data, ...(config ?? {}) });
    return response.data;
  } catch (error) {
    await handleAxiosError(error);
    throw error as unknown as Error;
  }
}

// TanStack Query generic function
export function getQueryFn<T>(): QueryFunction<T> {
  return async ({ queryKey }) => {
    try {
      const url = queryKey.join("/").replace(/^\/+/, "");
      const response = await axiosInstance.get<T>(`/${url}`);
      return response.data;
    } catch (error) {
      await handleAxiosError(error);
      throw error as unknown as Error;
    }
  };
}

// React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
    mutations: { retry: false },
  },
});
