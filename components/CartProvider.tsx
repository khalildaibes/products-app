"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  productId: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Adds a product once; returns false if it is already in the cart. */
  add: (productId: number) => boolean;
  has: (productId: number) => boolean;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "products-app-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* corrupted cart — start fresh */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full/blocked — cart just won't persist */
    }
  }, [items]);

  const value: CartContextValue = {
    items,
    add: (productId) => {
      if (items.some((i) => i.productId === productId)) return false;
      setItems((prev) =>
        prev.some((i) => i.productId === productId)
          ? prev
          : [...prev, { productId, quantity: 1 }]
      );
      return true;
    },
    has: (productId) => items.some((i) => i.productId === productId),
    setQuantity: (productId, quantity) =>
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i
        )
      ),
    remove: (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
    clear: () => setItems([]),
    count: items.length,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
