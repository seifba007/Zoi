import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, OrderType, Product, SelectedExtra } from "@/types";
import { createId, readValue, storageKeys, writeValue } from "@/services/storage";

/** Price of one line including its extras. */
export const getLineTotal = (item: CartItem) =>
  (item.unitPrice + item.extras.reduce((sum, extra) => sum + extra.price, 0)) * item.quantity;

/** Two lines merge only when product, extras and note match exactly. */
const isSameConfiguration = (a: CartItem, b: Omit<CartItem, "lineId">) => {
  if (a.productId !== b.productId) return false;
  if ((a.note ?? "") !== (b.note ?? "")) return false;
  if (a.extras.length !== b.extras.length) return false;
  const aIds = a.extras.map((extra) => extra.id).sort().join("|");
  const bIds = b.extras.map((extra) => extra.id).sort().join("|");
  return aIds === bIds;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Increments on every add — drives the badge bounce and fly-to-cart cue. */
  addPulse: number;
  addItem: (product: Product, options?: { quantity?: number; extras?: SelectedExtra[]; note?: string }) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => readValue<CartItem[]>(storageKeys.cart, []));
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [isOpen, setIsOpen] = useState(false);
  const [addPulse, setAddPulse] = useState(0);

  useEffect(() => {
    writeValue(storageKeys.cart, items);
  }, [items]);

  // Lock body scroll while the cart panel is open
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const addItem = useCallback<CartContextValue["addItem"]>((product, options) => {
    const candidate: Omit<CartItem, "lineId"> = {
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity: options?.quantity ?? 1,
      extras: options?.extras ?? [],
      note: options?.note?.trim() || undefined,
    };

    setItems((current) => {
      const existing = current.find((item) => isSameConfiguration(item, candidate));
      if (existing) {
        return current.map((item) =>
          item.lineId === existing.lineId
            ? { ...item, quantity: item.quantity + candidate.quantity }
            : item
        );
      }
      return [...current, { ...candidate, lineId: createId("line") }];
    });

    setAddPulse((pulse) => pulse + 1);
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.lineId !== lineId)
        : current.map((item) => (item.lineId === lineId ? { ...item, quantity } : item))
    );
  }, []);

  const removeItem = useCallback(
    (lineId: string) => setItems((current) => current.filter((item) => item.lineId !== lineId)),
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Number(items.reduce((sum, item) => sum + getLineTotal(item), 0).toFixed(2));

    return {
      items,
      itemCount,
      subtotal,
      orderType,
      setOrderType,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addPulse,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [items, orderType, isOpen, addPulse, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside a CartProvider");
  return context;
};
