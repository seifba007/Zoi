import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/ProductImage";
import { getLineTotal, useCart } from "@/context/CartProvider";
import { useStore } from "@/context/StoreProvider";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { useI18n } from "@/i18n/LanguageProvider";

/** Slide-in cart panel, shared by desktop and mobile. */
export const CartDrawer = () => {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, subtotal, itemCount } = useCart();
  const { settings } = useStore();
  const { isOpen: orderingOpen, label: openingLabel } = useOpeningStatus();
  const { t, tr, formatPrice } = useI18n();
  const navigate = useNavigate();

  // Escape closes the panel
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const threshold = settings.delivery.freeDeliveryThreshold;
  const missingForFree = threshold !== null ? threshold - subtotal : 0;

  const goToCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={t("cart.title")}
        >
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={closeCart}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 34 }}
            className="relative flex h-full w-full max-w-md flex-col bg-background shadow-lift sm:rounded-l-4xl"
          >
            {/* header */}
            <header className="flex items-center justify-between border-b border-border/70 px-6 py-5">
              <div>
                <h2 className="font-display text-xl font-bold">{t("cart.title")}</h2>
                {itemCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? t("cart.item") : t("cart.items")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeCart}
                aria-label={t("common.close")}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/[0.06] transition-colors hover:bg-foreground/[0.1]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* items */}
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">{t("cart.empty.title")}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{t("cart.empty.text")}</p>
                </div>
                <Button asChild variant="outline" onClick={closeCart}>
                  <Link to="/menu">{t("cart.empty.cta")}</Link>
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.lineId}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                        className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3"
                      >
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                          <ProductImage src={item.image} name={item.name} seed={item.productId} />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold leading-tight">{tr(item.name)}</h3>
                            <button
                              type="button"
                              onClick={() => removeItem(item.lineId)}
                              aria-label={`${t("cart.remove")}: ${tr(item.name)}`}
                              className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {item.extras.length > 0 && (
                            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                              {item.extras.map((extra) => tr(extra.name)).join(" · ")}
                            </p>
                          )}

                          {item.note && (
                            <p className="mt-1 flex items-start gap-1 text-xs italic leading-snug text-muted-foreground">
                              <MessageSquare className="mt-[0.15rem] h-3 w-3 shrink-0" />
                              {item.note}
                            </p>
                          )}

                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                                aria-label="−"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform active:scale-90"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                                aria-label="+"
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform active:scale-90"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-sm font-bold tabular-nums">
                              {formatPrice(getLineTotal(item))}
                            </span>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <button
                  type="button"
                  onClick={clearCart}
                  className="mx-auto mt-5 block text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
                >
                  {t("cart.clear")}
                </button>
              </div>
            )}

            {/* footer */}
            {items.length > 0 && (
              <footer className="space-y-4 border-t border-border/70 bg-card/60 px-6 py-5">
                {threshold !== null && missingForFree > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                      {t("cart.freeDeliveryHint", { amount: formatPrice(missingForFree) })}
                    </p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full bg-secondary"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (subtotal / threshold) * 100)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t("cart.subtotal")}</span>
                  <span className="font-display text-2xl font-extrabold tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {orderingOpen ? (
                  <Button size="lg" className="w-full" onClick={goToCheckout}>
                    {t("cart.checkout")}
                  </Button>
                ) : (
                  <div className="notice-amber space-y-2 p-4 text-center">
                    <p className="text-sm font-semibold">{t("status.orderingClosed")}</p>
                    <p className="text-xs text-ember-200/70">{openingLabel}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={closeCart}
                  className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("cart.continue")}
                </button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
