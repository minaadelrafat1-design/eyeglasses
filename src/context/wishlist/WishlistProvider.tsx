import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context';
import {
  fetchServerWishlist,
  addServerWishlistItem,
  removeServerWishlistItem,
  mergeGuestWishlist,
} from '@/services/wishlistService';

export interface WishlistContextValue {
  items: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = 'vuera.wishlist';

function loadInitial(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>(loadInitial);
  const isSyncing = useRef(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // non-fatal
    }
  }, [items]);

  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (prevUserId.current === currentUserId) return;
    prevUserId.current = currentUserId;

    if (currentUserId) {
      isSyncing.current = true;
      (async () => {
        const guestItems = loadInitial();
        if (guestItems.length > 0) {
          await mergeGuestWishlist(currentUserId, guestItems);
          window.localStorage.removeItem(STORAGE_KEY);
        }
        const serverItems = await fetchServerWishlist(currentUserId);
        setItems(serverItems);
        isSyncing.current = false;
      })();
    } else {
      setItems(loadInitial());
    }
  }, [user]);

  const toggle = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const isInList = prev.includes(productId);
        return isInList
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
      });

      if (user && !isSyncing.current) {
        const currentlyHas = items.includes(productId);
        if (currentlyHas) {
          void removeServerWishlistItem(user.id, productId);
        } else {
          void addServerWishlistItem(user.id, productId);
        }
      }
    },
    [user, items],
  );

  const has = useCallback((productId: string) => items.includes(productId), [items]);

  const value = useMemo<WishlistContextValue>(
    () => ({ items, has, toggle, count: items.length }),
    [items, has, toggle],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within a WishlistProvider');
  return ctx;
}
