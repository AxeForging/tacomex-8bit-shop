import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, ProductOption } from '@/types';
import { promoApi } from '@/services/api';

const TAX_RATE = 0.0825; // 8.25% tax
const DELIVERY_FEE = 3.99;
const FREE_DELIVERY_THRESHOLD = 25;

interface CartState {
  items: CartItem[];
  promoCode: string | undefined;
  discount: number;
  isCartOpen: boolean;
}

interface CartActions {
  addToCart: (product: Product, quantity?: number, options?: ProductOption[], instructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  setCartOpen: (open: boolean) => void;
}

interface CartComputedValues {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

type CartStore = CartState & CartActions;

// Helper to calculate subtotal
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const optionsPrice = item.selectedOptions?.reduce((opt, o) => opt + o.price, 0) || 0;
    return sum + (item.product.price + optionsPrice) * item.quantity;
  }, 0);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      promoCode: undefined,
      discount: 0,
      isCartOpen: false,

      // Actions
      addToCart: (product: Product, quantity = 1, options?: ProductOption[], instructions?: string) => {
        const { items } = get();

        // Check if item already exists with same options
        const existingIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            JSON.stringify(item.selectedOptions) === JSON.stringify(options)
        );

        if (existingIndex >= 0) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems, isCartOpen: true });
        } else {
          const newItem: CartItem = {
            id: `${product.id}-${Date.now()}`,
            product,
            quantity,
            selectedOptions: options,
            specialInstructions: instructions,
          };
          set({ items: [...items, newItem], isCartOpen: true });
        }
      },

      removeFromCart: (itemId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== itemId),
          }));
        } else {
          set((state) => ({
            items: state.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            ),
          }));
        }
      },

      clearCart: () => {
        set({ items: [], promoCode: undefined, discount: 0 });
      },

      applyPromoCode: async (code: string): Promise<boolean> => {
        const subtotal = calculateSubtotal(get().items);
        try {
          const response = await promoApi.validate(code, subtotal);
          const data = response.data;
          if (data.valid) {
            const discount = data.discount_amount || data.discount || 0;
            set({ promoCode: code, discount });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      removePromoCode: () => {
        set({ promoCode: undefined, discount: 0 });
      },

      setCartOpen: (open: boolean) => {
        set({ isCartOpen: open });
      },
    }),
    {
      name: 'tacomex-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        discount: state.discount,
      }),
    }
  )
);

// Selector hook with computed values
export const useCart = (): CartState & CartActions & CartComputedValues => {
  const store = useCartStore();

  const subtotal = calculateSubtotal(store.items);
  const tax = subtotal * TAX_RATE;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + tax + deliveryFee - store.discount;
  const itemCount = store.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: store.items,
    promoCode: store.promoCode,
    discount: store.discount,
    isCartOpen: store.isCartOpen,
    subtotal,
    tax,
    deliveryFee,
    total,
    itemCount,
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    applyPromoCode: store.applyPromoCode,
    removePromoCode: store.removePromoCode,
    setCartOpen: store.setCartOpen,
  };
};
