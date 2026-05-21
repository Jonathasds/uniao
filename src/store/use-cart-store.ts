import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  stock: number;
};

type CartStore = {
  items: CartItem[];
  discount: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
};

/**
 * Store global do carrinho de venda (Zustand).
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,

      addItem: (item) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? {
                    ...i,
                    quantity: Math.min(
                      i.quantity + (item.quantity ?? 1),
                      item.stock
                    ),
                  }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              { ...item, quantity: item.quantity ?? 1 },
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        });
      },

      setDiscount: (discount) => set({ discount }),

      clearCart: () => set({ items: [], discount: 0 }),

      getSubtotal: () =>
        get().items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),

      getTotal: () => Math.max(0, get().getSubtotal() - get().discount),
    }),
    { name: "uniao-cart" }
  )
);
