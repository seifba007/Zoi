import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Category,
  Extra,
  Order,
  OrderStatus,
  Product,
  RestaurantSettings,
} from "@/types";
import { seedCategories, seedExtras, seedProducts } from "@/data/menu";
import { seedSettings } from "@/data/settings";
import { generateDemoOrders } from "@/data/demoOrders";
import { createId, readValue, storageKeys, writeValue } from "@/services/storage";

/**
 * Single source of truth for menu, orders and restaurant settings.
 * Reads seed data on first run, then persists every mutation.
 * Swap the read/write calls for API requests to move to a real backend.
 */

type StoreContextValue = {
  categories: Category[];
  products: Product[];
  extras: Extra[];
  orders: Order[];
  settings: RestaurantSettings;
  ready: boolean;

  /* menu ------------------------------------------------------------ */
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string, available: boolean) => void;
  moveProduct: (id: string, direction: -1 | 1) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
  saveExtra: (extra: Extra) => void;
  deleteExtra: (id: string) => void;

  /* orders ---------------------------------------------------------- */
  addOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updateOrderEstimate: (id: string, minutes: number) => void;
  setOrderReadyAt: (id: string, readyAt: Date) => void;
  markOrderPaid: (id: string) => void;
  getOrderByNumber: (orderNumber: string) => Order | undefined;
  nextOrderNumber: () => string;

  /* settings -------------------------------------------------------- */
  saveSettings: (settings: RestaurantSettings) => void;

  /* helpers --------------------------------------------------------- */
  getProduct: (id: string) => Product | undefined;
  getExtras: (ids: string[]) => Extra[];
  productsByCategory: (categoryId: string) => Product[];
};

const StoreContext = createContext<StoreContextValue | null>(null);

const sortBySortOrder = <T extends { sortOrder: number }>(list: T[]) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings>(seedSettings);
  const [ready, setReady] = useState(false);

  // Hydrate from storage (or seed) once on mount
  useEffect(() => {
    setCategories(readValue(storageKeys.categories, seedCategories));
    setProducts(readValue(storageKeys.products, seedProducts));
    setExtras(readValue(storageKeys.extras, seedExtras));
    setSettings({ ...seedSettings, ...readValue(storageKeys.settings, seedSettings) });

    const storedOrders = readValue<Order[] | null>(storageKeys.orders, null);
    if (storedOrders) {
      setOrders(storedOrders);
    } else {
      const demo = generateDemoOrders();
      setOrders(demo);
      writeValue(storageKeys.orders, demo);
    }

    setReady(true);
  }, []);

  /* ------------------------------------------------------------- menu */

  const persistProducts = useCallback((next: Product[]) => {
    setProducts(next);
    writeValue(storageKeys.products, next);
  }, []);

  const persistCategories = useCallback((next: Category[]) => {
    setCategories(next);
    writeValue(storageKeys.categories, next);
  }, []);

  const persistExtras = useCallback((next: Extra[]) => {
    setExtras(next);
    writeValue(storageKeys.extras, next);
  }, []);

  const persistOrders = useCallback((next: Order[]) => {
    setOrders(next);
    writeValue(storageKeys.orders, next);
  }, []);

  const saveProduct = useCallback(
    (product: Product) => {
      const exists = products.some((entry) => entry.id === product.id);
      const next = exists
        ? products.map((entry) => (entry.id === product.id ? product : entry))
        : [...products, { ...product, id: product.id || createId("p") }];
      persistProducts(next);
    },
    [products, persistProducts]
  );

  const deleteProduct = useCallback(
    (id: string) => persistProducts(products.filter((product) => product.id !== id)),
    [products, persistProducts]
  );

  const toggleProductAvailability = useCallback(
    (id: string, available: boolean) =>
      persistProducts(products.map((product) => (product.id === id ? { ...product, available } : product))),
    [products, persistProducts]
  );

  /** Swaps sortOrder with the neighbour inside the same category. */
  const moveProduct = useCallback(
    (id: string, direction: -1 | 1) => {
      const target = products.find((product) => product.id === id);
      if (!target) return;

      const siblings = sortBySortOrder(products.filter((p) => p.categoryId === target.categoryId));
      const index = siblings.findIndex((p) => p.id === id);
      const neighbour = siblings[index + direction];
      if (!neighbour) return;

      persistProducts(
        products.map((product) => {
          if (product.id === target.id) return { ...product, sortOrder: neighbour.sortOrder };
          if (product.id === neighbour.id) return { ...product, sortOrder: target.sortOrder };
          return product;
        })
      );
    },
    [products, persistProducts]
  );

  const saveCategory = useCallback(
    (category: Category) => {
      const exists = categories.some((entry) => entry.id === category.id);
      const next = exists
        ? categories.map((entry) => (entry.id === category.id ? category : entry))
        : [...categories, { ...category, id: category.id || createId("cat") }];
      persistCategories(next);
    },
    [categories, persistCategories]
  );

  const deleteCategory = useCallback(
    (id: string) => persistCategories(categories.filter((category) => category.id !== id)),
    [categories, persistCategories]
  );

  const moveCategory = useCallback(
    (id: string, direction: -1 | 1) => {
      const ordered = sortBySortOrder(categories);
      const index = ordered.findIndex((category) => category.id === id);
      const neighbour = ordered[index + direction];
      if (index < 0 || !neighbour) return;

      const target = ordered[index];
      persistCategories(
        categories.map((category) => {
          if (category.id === target.id) return { ...category, sortOrder: neighbour.sortOrder };
          if (category.id === neighbour.id) return { ...category, sortOrder: target.sortOrder };
          return category;
        })
      );
    },
    [categories, persistCategories]
  );

  const saveExtra = useCallback(
    (extra: Extra) => {
      const exists = extras.some((entry) => entry.id === extra.id);
      const next = exists
        ? extras.map((entry) => (entry.id === extra.id ? extra : entry))
        : [...extras, { ...extra, id: extra.id || createId("ex") }];
      persistExtras(next);
    },
    [extras, persistExtras]
  );

  const deleteExtra = useCallback(
    (id: string) => {
      persistExtras(extras.filter((extra) => extra.id !== id));
      persistProducts(
        products.map((product) => ({
          ...product,
          extraIds: product.extraIds.filter((extraId) => extraId !== id),
        }))
      );
    },
    [extras, products, persistExtras, persistProducts]
  );

  /* ----------------------------------------------------------- orders */

  const nextOrderNumber = useCallback(() => {
    const stored = readValue<number>(storageKeys.counter, 1042);
    writeValue(storageKeys.counter, stored + 1);
    return `ZO-${stored}`;
  }, []);

  const addOrder = useCallback(
    (order: Order) => persistOrders([order, ...orders]),
    [orders, persistOrders]
  );

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) =>
      persistOrders(
        orders.map((order) =>
          order.id === id
            ? {
                ...order,
                status,
                statusHistory: [...order.statusHistory, { status, at: new Date().toISOString() }],
                // Cash is collected when the food changes hands
                payment:
                  order.payment.method === "cash" && (status === "completed" || status === "delivered")
                    ? { ...order.payment, status: "paid" as const }
                    : status === "cancelled" && order.payment.status === "paid"
                      ? { ...order.payment, status: "refunded" as const }
                      : order.payment,
              }
            : order
        )
      ),
    [orders, persistOrders]
  );

  const updateOrderEstimate = useCallback(
    (id: string, minutes: number) =>
      persistOrders(
        orders.map((order) =>
          order.id === id
            ? {
                ...order,
                estimatedMinutes: minutes,
                estimatedReadyAt: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
              }
            : order
        )
      ),
    [orders, persistOrders]
  );

  /** Sets an absolute handover time, e.g. the kitchen says "ready at 19:30". */
  const setOrderReadyAt = useCallback(
    (id: string, readyAt: Date) =>
      persistOrders(
        orders.map((order) =>
          order.id === id
            ? {
                ...order,
                estimatedReadyAt: readyAt.toISOString(),
                estimatedMinutes: Math.max(0, Math.round((readyAt.getTime() - Date.now()) / 60000)),
              }
            : order
        )
      ),
    [orders, persistOrders]
  );

  const markOrderPaid = useCallback(
    (id: string) =>
      persistOrders(
        orders.map((order) =>
          order.id === id ? { ...order, payment: { ...order.payment, status: "paid" as const } } : order
        )
      ),
    [orders, persistOrders]
  );

  const getOrderByNumber = useCallback(
    (orderNumber: string) => orders.find((order) => order.number === orderNumber),
    [orders]
  );

  /* --------------------------------------------------------- settings */

  const saveSettings = useCallback((next: RestaurantSettings) => {
    setSettings(next);
    writeValue(storageKeys.settings, next);
  }, []);

  /* ---------------------------------------------------------- helpers */

  const getProduct = useCallback(
    (id: string) => products.find((product) => product.id === id),
    [products]
  );

  const getExtras = useCallback(
    (ids: string[]) => ids.map((id) => extras.find((extra) => extra.id === id)).filter(Boolean) as Extra[],
    [extras]
  );

  const productsByCategory = useCallback(
    (categoryId: string) => sortBySortOrder(products.filter((product) => product.categoryId === categoryId)),
    [products]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      categories: sortBySortOrder(categories),
      products,
      extras,
      orders,
      settings,
      ready,
      saveProduct,
      deleteProduct,
      toggleProductAvailability,
      moveProduct,
      saveCategory,
      deleteCategory,
      moveCategory,
      saveExtra,
      deleteExtra,
      addOrder,
      updateOrderStatus,
      updateOrderEstimate,
      setOrderReadyAt,
      markOrderPaid,
      getOrderByNumber,
      nextOrderNumber,
      saveSettings,
      getProduct,
      getExtras,
      productsByCategory,
    }),
    [
      categories, products, extras, orders, settings, ready,
      saveProduct, deleteProduct, toggleProductAvailability, moveProduct,
      saveCategory, deleteCategory, moveCategory, saveExtra, deleteExtra,
      addOrder, updateOrderStatus, updateOrderEstimate, setOrderReadyAt, markOrderPaid,
      getOrderByNumber, nextOrderNumber, saveSettings,
      getProduct, getExtras, productsByCategory,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside a StoreProvider");
  return context;
};
