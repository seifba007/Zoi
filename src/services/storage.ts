/**
 * Persistence boundary.
 *
 * Everything the app stores goes through here, so replacing localStorage with
 * a REST/Supabase backend is a single-file change: keep the signatures, make
 * them async and swap the bodies.
 */

const NAMESPACE = "zoi.v1";

export const storageKeys = {
  categories: `${NAMESPACE}.categories`,
  products: `${NAMESPACE}.products`,
  extras: `${NAMESPACE}.extras`,
  orders: `${NAMESPACE}.orders`,
  settings: `${NAMESPACE}.settings`,
  cart: `${NAMESPACE}.cart`,
  session: `${NAMESPACE}.session`,
  counter: `${NAMESPACE}.orderCounter`,
} as const;

export const readValue = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeValue = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode) — the app keeps working in memory.
  }
};

export const removeValue = (key: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

/** Resets every stored collection back to the seed data. */
export const resetStorage = () => {
  Object.values(storageKeys).forEach(removeValue);
};

/** Small id helper — replaced by database ids once a backend is connected. */
export const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
