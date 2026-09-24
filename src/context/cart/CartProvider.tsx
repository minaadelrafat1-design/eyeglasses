import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cart, CartItem } from '@/types';
import { CartContext, type CartContextValue } from './CartContext';
import { useAuth } from '@/context';
import {
  fetchServerCart,
  upsertServerCartItem,
  updateServerCartItemQuantity,
  removeServerCartItem,
  clearServerCart,
  mergeGuestCart,
} from '@/services/cartService';

const STORAGE_KEY = 'vuera.cart';
const CURRENCY = 'USD';

interface CartProviderProps {
  children: React.ReactNode;
}

function loadInitial(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: CartProviderProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(loadInitial);
  const isSyncing = useRef(false);

  // Persist to localStorage for guests and as a fallback.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be full or disabled — non-fatal.
    }
  }, [items]);

  // On sign-in: merge guest cart into server, then load server cart.
  // On sign-out: revert to localStorage contents (guest cart).
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
          await mergeGuestCart(currentUserId, guestItems);
          window.localStorage.removeItem(STORAGE_KEY);
        }
        const serverItems = await fetchServerCart(currentUserId);
        setItems(serverItems);
        isSyncing.current = false;
      })();
    } else {
      setItems(loadInitial());
    }
  }, [user]);

  const addItem = useCallback(
    (item: CartItem) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        const next = existing
          ? prev.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i,
            )
          : [...prev, item];
        return next;
      });

      if (user && !isSyncing.current) {
        void upsertServerCartItem(user.id, item);
      }
    },
    [user],
  );

  const updateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      setItems((prev) =>
        prev
          .map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0),
      );

      if (user && !isSyncing.current) {
        void updateServerCartItemQuantity(user.id, variantId, quantity);
      }
    },
    [user],
  );

  const removeItem = useCallback(
    (variantId: string) => {
      setItems((prev) => prev.filter((i) => i.variantId !== variantId));

      if (user && !isSyncing.current) {
        void removeServerCartItem(user.id, variantId);
      }
    },
    [user],
  );

  const clear = useCallback(() => {
    setItems([]);
    if (user && !isSyncing.current) {
      void clearServerCart(user.id);
    }
  }, [user]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [items],
  );
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const cart: Cart = useMemo(
    () => ({ items, subtotalCents, currency: CURRENCY }),
    [items, subtotalCents],
  );

  const value = useMemo<CartContextValue>(
    () => ({ items, subtotalCents, count, addItem, updateQuantity, removeItem, clear, cart }),
    [items, subtotalCents, count, addItem, updateQuantity, removeItem, clear, cart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
