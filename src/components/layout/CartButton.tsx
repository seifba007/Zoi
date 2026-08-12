import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/** Cart trigger with an item badge that reacts whenever something is added. */
export const CartButton = ({ inverted = false, className }: { inverted?: boolean; className?: string }) => {
  const { itemCount, openCart, addPulse } = useCart();
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!addPulse || reduced) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 450);
    return () => window.clearTimeout(timer);
  }, [addPulse, reduced]);

  return (
    <motion.button
      type="button"
      onClick={openCart}
      animate={bump ? { scale: [1, 1.16, 0.96, 1] } : { scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      aria-label={`${t("nav.cart")}${itemCount ? ` (${itemCount})` : ""}`}
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-200",
        inverted
          ? "bg-white/10 text-cream-100 ring-1 ring-white/15 hover:bg-white/20"
          : "bg-foreground/[0.06] text-foreground ring-1 ring-border/70 hover:bg-foreground/[0.1]",
        className
      )}
    >
      <ShoppingBag className="h-[1.15rem] w-[1.15rem]" />

      <AnimatePresence>
        {itemCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 520, damping: 22 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-primary-foreground ring-2 ring-background"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
