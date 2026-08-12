import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Product } from "@/types";
import { ProductModal } from "@/components/menu/ProductModal";

/** Keeps a single product sheet mounted so any card anywhere can open it. */

type ProductModalContextValue = {
  openProduct: (product: Product) => void;
  closeProduct: () => void;
  activeProduct: Product | null;
};

const ProductModalContext = createContext<ProductModalContextValue | null>(null);

export const ProductModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const openProduct = useCallback((product: Product) => setActiveProduct(product), []);
  const closeProduct = useCallback(() => setActiveProduct(null), []);

  const value = useMemo(
    () => ({ openProduct, closeProduct, activeProduct }),
    [openProduct, closeProduct, activeProduct]
  );

  return (
    <ProductModalContext.Provider value={value}>
      {children}
      <ProductModal product={activeProduct} onClose={closeProduct} />
    </ProductModalContext.Provider>
  );
};

export const useProductModal = () => {
  const context = useContext(ProductModalContext);
  if (!context) throw new Error("useProductModal must be used inside a ProductModalProvider");
  return context;
};
