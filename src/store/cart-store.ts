import type { Product } from "@/types/shop";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  quantity: number;
  title: string;
  price: number;
  thumb?: string;
};

type CartActions = {
  add: (product: Product, delta?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export type CartState = {
  items: CartLine[];
} & CartActions;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, delta = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === product.id);
        if (existing) {
          existing.quantity = Math.max(1, existing.quantity + delta);
        } else {
          items.push({
            productId: product.id,
            quantity: Math.max(1, delta),
            title: product.name,
            price: product.price,
            thumb: product.photo,
          });
        }
        set({ items });
      },
      setQuantity: (productId, quantity) =>
        set({
          items: get()
            .items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item,
            ),
        }),
      remove: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "internet-shop-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function calculateCartTotals(items: CartLine[]) {
  return items.reduce(
    (acc, item) => {
      acc.quantity += item.quantity;
      acc.sum += item.price * item.quantity;
      return acc;
    },
    { quantity: 0, sum: 0 },
  );
}
