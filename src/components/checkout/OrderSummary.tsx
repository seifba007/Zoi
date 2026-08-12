import { motion } from "framer-motion";
import { ProductImage } from "@/components/shared/ProductImage";
import { getLineTotal, useCart } from "@/context/CartProvider";
import { useI18n } from "@/i18n/LanguageProvider";

/** Live totals shown beside the checkout form and inside the mobile drawer. */
export const OrderSummary = ({
  deliveryFee,
  showItems = true,
}: {
  deliveryFee: number;
  showItems?: boolean;
}) => {
  const { items, subtotal } = useCart();
  const { t, tr, formatPrice } = useI18n();
  const total = subtotal + deliveryFee;

  return (
    <div className="rounded-4xl border border-border/70 bg-card p-6 shadow-soft">
      <h2 className="font-display text-lg font-bold">{t("checkout.summary")}</h2>

      {showItems && (
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.lineId} className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <ProductImage src={item.image} name={item.name} seed={item.productId} />
                <span className="absolute bottom-0 right-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-tl-lg bg-ink-900/90 px-1 text-[0.65rem] font-bold text-cream-100">
                  {item.quantity}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{tr(item.name)}</p>
                {item.extras.length > 0 && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {item.extras.map((extra) => tr(extra.name)).join(" · ")}
                  </p>
                )}
                {item.note && (
                  <p className="mt-0.5 text-xs italic leading-snug text-muted-foreground">“{item.note}”</p>
                )}
              </div>

              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {formatPrice(getLineTotal(item))}
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-6 space-y-2.5 border-t border-border/70 pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
        </div>

        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("cart.deliveryFee")}</dt>
          <dd className="font-semibold tabular-nums">
            {deliveryFee > 0 ? formatPrice(deliveryFee) : t("cart.freeDelivery")}
          </dd>
        </div>

        <div className="flex items-baseline justify-between border-t border-border/70 pt-4">
          <dt className="font-display text-base font-bold">{t("cart.total")}</dt>
          <motion.dd
            key={total}
            initial={{ opacity: 0.4, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="font-display text-2xl font-extrabold tabular-nums"
          >
            {formatPrice(total)}
          </motion.dd>
        </div>
      </dl>
    </div>
  );
};
