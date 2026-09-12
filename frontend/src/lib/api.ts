import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export const TOKEN_KEY = "revision_calendar_token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://revision-calender.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setToken(null);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string | Array<{ msg?: string }> }
      | undefined;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((item) => item.msg ?? "Invalid input").join(", ");
    }
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    if (error.code === "ERR_NETWORK") {
      return "Cannot reach the server. Is the backend running?";
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
