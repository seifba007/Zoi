import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2, Clock, ShoppingBag, Bike, Wallet, CreditCard,
  ShieldCheck, Phone, MapPin, Home, SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/ProductImage";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { getLineTotal } from "@/context/CartProvider";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { TranslationKey } from "@/i18n/translations";

/** Confirmation + live tracking. The URL is shareable, so guests can return to it. */
const OrderConfirmationPage = () => {
  const { orderNumber = "" } = useParams();
  const { orders, settings, ready } = useStore();
  const { t, tr, formatPrice, formatTime, formatDate } = useI18n();
  const reduced = useReducedMotion();

  const order = useMemo(
    () => orders.find((entry) => entry.number.toLowerCase() === orderNumber.toLowerCase()),
    [orders, orderNumber]
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  if (!ready) {
    return (
      <div className="container-width flex min-h-[70svh] items-center justify-center pt-24">
        <div className="skeleton h-64 w-full max-w-2xl rounded-4xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-width flex min-h-[70svh] flex-col items-center justify-center gap-5 pt-24 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <SearchX className="h-7 w-7 text-muted-foreground" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-extrabold">{t("confirm.notFound.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("confirm.notFound.text")}</p>
        </div>
        <Button asChild>
          <Link to="/">
            <Home />
            {t("confirm.backHome")}
          </Link>
        </Button>
      </div>
    );
  }

  const isDelivery = order.type === "delivery";
  const PaymentIcon =
    order.payment.method === "cash" ? Wallet : order.payment.method === "card" ? CreditCard : ShieldCheck;

  const facts = [
    {
      icon: ShoppingBag,
      label: t("confirm.customer"),
      value: order.customer.name,
    },
    {
      icon: isDelivery ? Bike : ShoppingBag,
      label: t("confirm.type"),
      value: t(isDelivery ? "status.delivery" : "status.pickup"),
    },
    {
      icon: PaymentIcon,
      label: t("confirm.payment"),
      value: `${t(
        order.payment.method === "cash"
          ? "checkout.payment.cash"
          : (`checkout.payment.${order.payment.method}` as TranslationKey)
      )} · ${t(`payment.status.${order.payment.status}` as TranslationKey)}`,
    },
    {
      icon: Clock,
      label: t("admin.orders.estimate"),
      value: formatTime(order.estimatedReadyAt),
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-24 pt-[5.5rem] lg:pt-28">
      <div className="container-width max-w-4xl">
        {/* hero */}
        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 20 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-4xl border border-border/70 bg-card p-7 text-center shadow-soft sm:p-10"
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-success/10 blur-3xl" />

          <motion.span
            initial={reduced ? undefined : { scale: 0.4, opacity: 0 }}
            animate={reduced ? undefined : { scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 18 }}
            className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
          >
            <CheckCircle2 className="h-8 w-8" />
          </motion.span>

          <h1 className="display-xl relative mt-6 text-[clamp(1.75rem,4.5vw,2.75rem)]">
            {t("confirm.title")}
          </h1>
          <p className="relative mt-3 text-muted-foreground">{t("confirm.subtitle")}</p>

          <div className="relative mt-7 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-ink-900 px-5 py-2.5 font-display text-lg font-extrabold tracking-wide text-cream-100">
              {order.number}
            </span>
            <span className="rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground">
              {t(isDelivery ? "confirm.deliveryAt" : "confirm.readyAt", {
                time: formatTime(order.estimatedReadyAt),
              })}
            </span>
          </div>

          <p className="relative mt-4 text-xs text-muted-foreground">{t("confirm.trackHint")}</p>
        </motion.div>

        {/* status */}
        <section className="mt-6 rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-lg font-bold">{t("confirm.status")}</h2>
            <span className="text-xs text-muted-foreground">
              {formatDate(order.createdAt, true)}
            </span>
          </div>
          <div className="mt-7">
            <OrderStatusTimeline status={order.status} type={order.type} />
          </div>
        </section>

        {/* facts */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-basil-400/10 text-basil-300">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug">{value}</p>
            </div>
          ))}
        </section>

        {/* items */}
        <section className="mt-6 rounded-4xl border border-border/70 bg-card p-6 shadow-soft sm:p-8">
          <h2 className="font-display text-lg font-bold">{t("confirm.items")}</h2>

          <ul className="mt-5 space-y-4">
            {order.items.map((item) => (
              <li key={item.lineId} className="flex gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                  <ProductImage src={item.image} name={item.name} seed={item.productId} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-tight">
                    {item.quantity}× {tr(item.name)}
                  </p>
                  {item.extras.length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.extras.map((extra) => tr(extra.name)).join(" · ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="mt-1 text-sm italic text-muted-foreground">“{item.note}”</p>
                  )}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{formatPrice(getLineTotal(item))}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2.5 border-t border-border/70 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {isDelivery && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("cart.deliveryFee")}
                  {order.zoneLabel && <span className="ml-1 text-xs">({order.zoneLabel})</span>}
                </dt>
                <dd className="font-semibold tabular-nums">
                  {order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : t("cart.freeDelivery")}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border/70 pt-4">
              <dt className="font-display text-base font-bold">{t("confirm.total")}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>

        {/* pickup / delivery details */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="flex items-center gap-2 font-display text-base font-bold">
              <MapPin className="h-4 w-4 text-basil-300" />
              {isDelivery ? t("checkout.address.title") : t("contact.address")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {isDelivery ? (
                <>
                  {order.customer.street} {order.customer.houseNumber}
                  <br />
                  {order.customer.zip} {order.customer.city}
                  {order.customer.addressExtra && (
                    <>
                      <br />
                      {order.customer.addressExtra}
                    </>
                  )}
                </>
              ) : (
                <>
                  {settings.address.street}
                  <br />
                  {settings.address.zip} {settings.address.city}
                </>
              )}
            </p>
            {order.customer.comment && (
              <p className="mt-3 rounded-xl bg-muted p-3 text-sm italic text-muted-foreground">
                “{order.customer.comment}”
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
            <h3 className="flex items-center gap-2 font-display text-base font-bold">
              <Phone className="h-4 w-4 text-basil-300" />
              {t("nav.contact")}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">{settings.name}</p>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="mt-1 block text-sm font-semibold transition-colors hover:text-basil-300"
            >
              {settings.phone}
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-basil-300"
            >
              {settings.email}
            </a>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/">
              <Home />
              {t("confirm.backHome")}
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/menu">{t("nav.order")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
