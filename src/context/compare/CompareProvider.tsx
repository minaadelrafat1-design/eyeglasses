import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Comparison tray.
 *
 * Holds up to `MAX_COMPARE` product ids, persisted to localStorage so a
 * comparison survives navigation and reloads. Product data is resolved by the
 * service layer at render time, keeping this context storage-agnostic.
 */

export const MAX_COMPARE = 4;

export interface CompareContextValue {
  items: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "vuera.compare";

function loadInitial(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([]);

  // Read after mount so server and client render the same markup.
  useEffect(() => {
    setItems(loadInitial());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // non-fatal
    }
  }, [items]);

  const add = useCallback((productId: string) => {
    setItems((prev) =>
      prev.includes(productId) || prev.length >= MAX_COMPARE ? prev : [...prev, productId],
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((id) => id !== productId));
  }, []);

  const toggle = useCallback((productId: string) => {
    setItems((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      return prev.length >= MAX_COMPARE ? prev : [...prev, productId];
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      has: (id: string) => items.includes(id),
      toggle,
      add,
      remove,
      clear,
      count: items.length,
      isFull: items.length >= MAX_COMPARE,
    }),
    [items, toggle, add, remove, clear],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider");
  return ctx;
}
