import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenResponse } from "../types";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 15_000,
});

let accessToken: string | null = null;
function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

let csrfToken: string | null = readCookie("csrf_token");
let refreshPromise: Promise<string> | null = null;

export function setSession(tokens: TokenResponse | null): void {
  accessToken = tokens?.access_token ?? null;
  csrfToken = tokens?.csrf_token ?? null;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (csrfToken && ["post", "put", "patch", "delete"].includes(config.method ?? "")) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/refresh")
    ) {
      throw error;
    }
    original._retry = true;
    refreshPromise ??= axios
      .post<TokenResponse>(
        "/api/auth/refresh",
        {},
        {
          withCredentials: true,
          headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
        },
      )
      .then(({ data }) => {
        setSession(data);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
    const token = await refreshPromise;
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string | Array<{ msg: string }> }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((item) => item.msg).join(", ");
    if (error.code === "ECONNABORTED") return "Сервер не ответил вовремя";
  }
  return "Не удалось выполнить операцию";
}

export default api;
