import { createContext, useContext } from 'react';
import type { Cart, CartItem } from '@/types';

export interface CartContextValue {
  items: CartItem[];
  subtotalCents: number;
  count: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  cart: Cart;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
