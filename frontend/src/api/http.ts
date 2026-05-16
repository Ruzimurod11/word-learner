import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@/types/word";
import i18n from "@/i18n";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const API_ROOT = API_BASE.replace(/\/$/, "");

export const http = axios.create({ baseURL: API_ROOT });

http.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = i18n.language;
  return config;
});

export const unwrap = <T,>(payload: ApiResponse<T>): T => {
  if (!payload.success) {
    throw new Error(payload.error);
  }
  return payload.data;
};

export const handleError = (err: unknown): never => {
  if (err instanceof AxiosError && err.response?.data) {
    const data = err.response.data as Partial<ApiResponse<unknown>>;
    if (data && "error" in data && typeof data.error === "string") {
      throw new Error(data.error);
    }
  }
  if (err instanceof Error) throw err;
  throw new Error(i18n.t("common.error"));
};
