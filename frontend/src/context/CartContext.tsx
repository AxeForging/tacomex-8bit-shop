import React, { createContext, useContext, ReactNode } from 'react';
import { Cart, CartItem, Product, ProductOption } from '../types';
import { useCart as useCartStore } from '../stores';

interface CartContextType extends Cart {
  addToCart: (product: Product, quantity?: number, options?: ProductOption[], instructions?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = useCartStore();

  const value: CartContextType = {
    items: store.items,
    subtotal: store.subtotal,
    tax: store.tax,
    deliveryFee: store.deliveryFee,
    discount: store.discount,
    total: store.total,
    promoCode: store.promoCode,
    addToCart: store.addToCart,
    removeFromCart: store.removeFromCart,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    applyPromoCode: store.applyPromoCode,
    removePromoCode: store.removePromoCode,
    isCartOpen: store.isCartOpen,
    setCartOpen: store.setCartOpen,
    itemCount: store.itemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// For backward compatibility, this hook works the same as before
// but now uses Zustand under the hood
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    // If used outside CartProvider, fallback to direct store usage
    const store = useCartStore();
    return {
      items: store.items,
      subtotal: store.subtotal,
      tax: store.tax,
      deliveryFee: store.deliveryFee,
      discount: store.discount,
      total: store.total,
      promoCode: store.promoCode,
      addToCart: store.addToCart,
      removeFromCart: store.removeFromCart,
      updateQuantity: store.updateQuantity,
      clearCart: store.clearCart,
      applyPromoCode: store.applyPromoCode,
      removePromoCode: store.removePromoCode,
      isCartOpen: store.isCartOpen,
      setCartOpen: store.setCartOpen,
      itemCount: store.itemCount,
    };
  }
  return context;
};

export default CartContext;
