import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Bike, ShoppingBag, Phone, MapPin, MessageSquare, Clock, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AdminField, EmptyState, OrderStatusChip, PageHeader, Panel, PaymentChip,
} from "@/components/admin/AdminUI";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { getLineTotal } from "@/context/CartProvider";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { DELIVERY_FLOW, Order, OrderStatus, PICKUP_FLOW } from "@/types";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const FILTERS: { key: string; statuses: OrderStatus[] | null }[] = [
  { key: "all", statuses: null },
  { key: "new", statuses: ["new"] },
  { key: "preparing", statuses: ["accepted", "preparing"] },
  { key: "ready", statuses: ["ready", "on_the_way"] },
  { key: "completed", statuses: ["completed", "delivered"] },
  { key: "cancelled", statuses: ["cancelled"] },
];

const ESTIMATE_PRESETS = [15, 20, 30, 45, 60];

const AdminOrders = () => {
  const { orders, updateOrderStatus, updateOrderEstimate, setOrderReadyAt, markOrderPaid } = useStore();
  const { t, tr, formatPrice, formatTime, formatDate } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customMinutes, setCustomMinutes] = useState("");
  const [readyAtTime, setReadyAtTime] = useState("");

  // Deep link from the dashboard: /admin/orders?order=ZO-1042
  useEffect(() => {
    const number = searchParams.get("order");
    if (!number) return;
    const match = orders.find((order) => order.number === number);
    if (match) setSelectedId(match.id);
  }, [searchParams, orders]);

  const filtered = useMemo(() => {
    const statuses = FILTERS.find((entry) => entry.key === filter)?.statuses;
    const normalized = query.trim().toLowerCase();

    return orders.filter((order) => {
      if (statuses && !statuses.includes(order.status)) return false;
      if (!normalized) return true;
      return `${order.number} ${order.customer.name} ${order.customer.phone}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [orders, filter, query]);

  const selected = orders.find((order) => order.id === selectedId) ?? null;

  // Prefill the estimate controls from the order currently open
  useEffect(() => {
    if (!selected) return;
    setCustomMinutes(String(selected.estimatedMinutes));
    const readyAt = new Date(selected.estimatedReadyAt);
    setReadyAtTime(
      `${String(readyAt.getHours()).padStart(2, "0")}:${String(readyAt.getMinutes()).padStart(2, "0")}`
    );
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeDetails = () => {
    setSelectedId(null);
    if (searchParams.get("order")) setSearchParams({}, { replace: true });
  };

  const changeStatus = (order: Order, status: OrderStatus) => {
    updateOrderStatus(order.id, status);
    toast.success(t("admin.orders.statusSaved"));
  };

  const changeEstimate = (order: Order, minutes: number) => {
    updateOrderEstimate(order.id, minutes);
    toast.success(t("admin.orders.estimateSaved"));
  };

  /** "Ready at 19:30" — rolls to tomorrow if the time has already passed today. */
  const applyReadyAt = (order: Order) => {
    if (!readyAtTime) return;
    const [hours, minutes] = readyAtTime.split(":").map(Number);
    const readyAt = new Date();
    readyAt.setHours(hours, minutes, 0, 0);
    if (readyAt.getTime() < Date.now()) readyAt.setDate(readyAt.getDate() + 1);

    setOrderReadyAt(order.id, readyAt);
    toast.success(t("admin.orders.estimateSaved"));
  };

  return (
    <>
      <PageHeader title={t("admin.orders.title")} subtitle={t("admin.orders.subtitle")} />

      <Panel>
        {/* filters */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {FILTERS.map(({ key }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "relative shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                  filter === key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter === key && (
                  <motion.span
                    layoutId="order-filter"
                    className="absolute inset-0 -z-10 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {key === "all"
                  ? t("admin.orders.all")
                  : t(`orderStatus.${key === "preparing" ? "preparing" : key === "ready" ? "ready" : key}` as TranslationKey)}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("admin.orders.search")}
              aria-label={t("admin.orders.search")}
              className="field h-11 pl-10 lg:w-80"
            />
          </div>
        </div>

        {/* list */}
        {filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={t("admin.orders.empty")} icon={ReceiptText} />
          </div>
        ) : (
          <div className="-mx-2 mt-5 overflow-x-auto">
            <table className="w-full min-w-[48rem] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 pb-3 font-bold">#</th>
                  <th className="px-2 pb-3 font-bold">{t("admin.orders.customer")}</th>
                  <th className="px-2 pb-3 font-bold">{t("confirm.type")}</th>
                  <th className="px-2 pb-3 font-bold">{t("admin.orders.createdAt")}</th>
                  <th className="px-2 pb-3 font-bold">{t("confirm.payment")}</th>
                  <th className="px-2 pb-3 text-right font-bold">{t("cart.total")}</th>
                  <th className="px-2 pb-3 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {filtered.slice(0, 60).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <td className="px-2 py-3 font-bold">{order.number}</td>
                    <td className="px-2 py-3">
                      <p className="font-medium">{order.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        {order.type === "delivery" ? <Bike className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
                        {t(order.type === "delivery" ? "status.delivery" : "status.pickup")}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      <span className="tabular-nums">{formatDate(order.createdAt, true)}</span>
                    </td>
                    <td className="px-2 py-3">
                      <PaymentChip status={order.payment.status} />
                    </td>
                    <td className="px-2 py-3 text-right font-bold tabular-nums">{formatPrice(order.total)}</td>
                    <td className="px-2 py-3 text-right">
                      <OrderStatusChip status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* details */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex justify-end"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={closeDetails}
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-background shadow-lift"
            >
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border/70 bg-background/95 px-6 py-5 backdrop-blur">
                <div>
                  <p className="font-display text-xl font-extrabold">{selected.number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(selected.createdAt, true)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusChip status={selected.status} />
                  <button
                    type="button"
                    onClick={closeDetails}
                    aria-label={t("common.close")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.06]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div className="space-y-6 p-6">
                {/* timeline */}
                <OrderStatusTimeline status={selected.status} type={selected.type} />

                {/* status control */}
                <div>
                  <h3 className="field-label">{t("admin.orders.setStatus")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selected.type === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => changeStatus(selected, status)}
                        className={cn(
                          "rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                          selected.status === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                      >
                        {t(`orderStatus.${status}` as TranslationKey)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => changeStatus(selected, "cancelled")}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                        selected.status === "cancelled"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}
                    >
                      {t("orderStatus.cancelled")}
                    </button>
                  </div>
                </div>

                {/* estimate — presets, custom minutes, or an exact handover time */}
                <div className="rounded-2xl border border-border/70 p-4">
                  <h3 className="flex items-baseline justify-between gap-3 font-display text-sm font-bold">
                    {t("admin.orders.estimate")}
                    <span className="font-sans text-xs font-semibold text-basil-300 tabular-nums">
                      {formatTime(selected.estimatedReadyAt)}
                    </span>
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ESTIMATE_PRESETS.map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => changeEstimate(selected, minutes)}
                        className="rounded-full bg-muted px-3.5 py-2 text-xs font-bold text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                      >
                        {minutes} {t("common.min")}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor="estimate-minutes">
                        {t("admin.orders.estimateCustom")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="estimate-minutes"
                          type="number"
                          min="0"
                          step="5"
                          value={customMinutes}
                          onChange={(event) => setCustomMinutes(event.target.value)}
                          className="field h-11"
                          placeholder="45"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-11 shrink-0"
                          onClick={() => {
                            const minutes = Number(customMinutes);
                            if (!Number.isFinite(minutes) || minutes < 0) return;
                            changeEstimate(selected, minutes);
                          }}
                        >
                          {t("admin.orders.estimateApply")}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="field-label" htmlFor="estimate-time">
                        {t("admin.orders.estimateReadyAt")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="estimate-time"
                          type="time"
                          value={readyAtTime}
                          onChange={(event) => setReadyAtTime(event.target.value)}
                          className="field h-11 [color-scheme:dark]"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-11 shrink-0"
                          onClick={() => applyReadyAt(selected)}
                        >
                          {t("admin.orders.estimateApply")}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">{t("admin.orders.estimateMinutes")}</p>
                </div>

                {/* customer */}
                <div className="rounded-2xl border border-border/70 p-4">
                  <h3 className="font-display text-sm font-bold">{t("admin.orders.customer")}</h3>
                  <p className="mt-2 font-medium">{selected.customer.name}</p>
                  <a
                    href={`tel:${selected.customer.phone.replace(/\s/g, "")}`}
                    className="mt-1 inline-flex items-center gap-2 text-sm text-basil-300 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {selected.customer.phone}
                  </a>

                  {selected.type === "delivery" && (
                    <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>
                        {selected.customer.street} {selected.customer.houseNumber}
                        <br />
                        {selected.customer.zip} {selected.customer.city}
                        {selected.customer.addressExtra && (
                          <>
                            <br />
                            {selected.customer.addressExtra}
                          </>
                        )}
                        {selected.distanceKm !== undefined && (
                          <>
                            <br />
                            <span className="text-xs">
                              {selected.distanceKm} km · {selected.zoneLabel}
                            </span>
                          </>
                        )}
                      </span>
                    </p>
                  )}

                  {selected.customer.comment && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm italic text-muted-foreground">
                      <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {selected.customer.comment}
                    </p>
                  )}
                </div>

                {/* items */}
                <div className="rounded-2xl border border-border/70 p-4">
                  <h3 className="font-display text-sm font-bold">{t("confirm.items")}</h3>
                  <ul className="mt-3 space-y-3">
                    {selected.items.map((item) => (
                      <li key={item.lineId} className="flex gap-3 text-sm">
                        <span className="font-bold tabular-nums">{item.quantity}×</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{tr(item.name)}</p>
                          {item.extras.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {item.extras.map((extra) => tr(extra.name)).join(" · ")}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-xs italic text-muted-foreground">“{item.note}”</p>
                          )}
                        </div>
                        <span className="font-semibold tabular-nums">{formatPrice(getLineTotal(item))}</span>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-4 space-y-2 border-t border-border/70 pt-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
                      <dd className="tabular-nums">{formatPrice(selected.subtotal)}</dd>
                    </div>
                    {selected.type === "delivery" && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">{t("cart.deliveryFee")}</dt>
                        <dd className="tabular-nums">{formatPrice(selected.deliveryFee)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-border/70 pt-2 font-bold">
                      <dt>{t("cart.total")}</dt>
                      <dd className="tabular-nums">{formatPrice(selected.total)}</dd>
                    </div>
                  </dl>
                </div>

                {/* payment */}
                <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                  <div>
                    <h3 className="font-display text-sm font-bold">{t("admin.orders.paymentStatus")}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(
                        selected.payment.method === "cash"
                          ? "checkout.payment.cash"
                          : (`checkout.payment.${selected.payment.method}` as TranslationKey)
                      )}
                      {selected.payment.reference && ` · ${selected.payment.reference}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PaymentChip status={selected.payment.status} />
                    {selected.payment.status === "pending" && (
                      <Button size="sm" variant="outline" onClick={() => markOrderPaid(selected.id)}>
                        {t("admin.orders.markPaid")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* history */}
                <div className="rounded-2xl border border-border/70 p-4">
                  <h3 className="flex items-center gap-2 font-display text-sm font-bold">
                    <Clock className="h-3.5 w-3.5" />
                    {t("confirm.status")}
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {selected.statusHistory.map((entry, index) => (
                      <li key={`${entry.status}-${index}`} className="flex justify-between">
                        <span>{t(`orderStatus.${entry.status}` as TranslationKey)}</span>
                        <span className="tabular-nums">{formatDate(entry.at, true)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminOrders;
