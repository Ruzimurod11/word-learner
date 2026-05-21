import { useSyncExternalStore } from "react";

const STORAGE_KEY = "admin_token";
const listeners = new Set<() => void>();

const emit = (): void => {
  for (const l of listeners) l();
};

export const getToken = (): string | null => {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEY, token);
  emit();
};

export const clearToken = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  emit();
};

const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) emit();
  });
}

export const useIsAdmin = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => getToken() !== null,
    () => false,
  );
