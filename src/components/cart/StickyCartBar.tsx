import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartProvider";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * Mobile-only bar that keeps the cart one thumb-tap away while browsing.
 * Hidden on checkout, where the totals are already on screen.
 */
export const StickyCartBar = () => {
  const { itemCount, subtotal, openCart, isOpen } = useCart();
  const { t, formatPrice } = useI18n();
  const location = useLocation();

  const hidden =
    itemCount === 0 ||
    isOpen ||
    location.pathname.startsWith("/checkout") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/order/");

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          <button
            type="button"
            onClick={openCart}
            className="flex w-full items-center justify-between gap-4 rounded-full bg-ink-900 px-5 py-4 text-cream-100 shadow-lift transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <ShoppingBag className="h-4 w-4" />
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground"
                >
                  {itemCount}
                </motion.span>
              </span>
              <span className="text-sm font-bold">{t("cart.viewCart")}</span>
            </span>
            <span className="font-display text-lg font-extrabold tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
