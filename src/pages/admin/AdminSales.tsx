import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ReceiptText, Euro, TrendingUp, CreditCard, Wallet, Bike, ShoppingBag, XCircle, PackageSearch,
} from "lucide-react";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/admin/AdminUI";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  endOfDay, filterByRange, revenueByDay, startOfDay, summarize, topProducts,
} from "@/services/analytics";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

type RangeKey = "today" | "yesterday" | "7d" | "30d" | "custom";

const RANGES: { key: RangeKey; label: TranslationKey }[] = [
  { key: "today", label: "admin.sales.range.today" },
  { key: "yesterday", label: "admin.sales.range.yesterday" },
  { key: "7d", label: "admin.sales.range.7d" },
  { key: "30d", label: "admin.sales.range.30d" },
  { key: "custom", label: "admin.sales.range.custom" },
];

const toInputDate = (date: Date) => date.toISOString().slice(0, 10);

const AdminSales = () => {
  const { orders } = useStore();
  const { t, tr, formatPrice, locale } = useI18n();

  const [range, setRange] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState(toInputDate(new Date(Date.now() - 6 * 864e5)));
  const [customTo, setCustomTo] = useState(toInputDate(new Date()));

  const { from, to } = useMemo(() => {
    const now = new Date();
    switch (range) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "yesterday": {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      }
      case "7d": {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        return { from: startOfDay(start), to: endOfDay(now) };
      }
      case "30d": {
        const start = new Date(now);
        start.setDate(now.getDate() - 29);
        return { from: startOfDay(start), to: endOfDay(now) };
      }
      case "custom":
      default:
        return { from: startOfDay(new Date(customFrom)), to: endOfDay(new Date(customTo)) };
    }
  }, [range, customFrom, customTo]);

  const scoped = useMemo(() => filterByRange(orders, from, to), [orders, from, to]);
  const stats = useMemo(() => summarize(scoped), [scoped]);
  const best = useMemo(() => topProducts(scoped, 6), [scoped]);

  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 864e5));
  const series = useMemo(
    () =>
      revenueByDay(scoped, Math.min(30, days)).map((entry) => ({
        ...entry,
        label: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(entry.date),
      })),
    [scoped, days, locale]
  );

  return (
    <>
      <PageHeader title={t("admin.sales.title")} subtitle={t("admin.sales.subtitle")} />

      {/* range picker */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                range === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
              )}
            >
              {t(label)}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label={t("admin.hours.from")}
              className="field h-11 w-40"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="date"
              aria-label={t("admin.hours.to")}
              className="field h-11 w-40"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </div>
        )}
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.sales.totalOrders")} value={stats.orders} icon={ReceiptText} tone="primary" />
        <StatCard label={t("admin.sales.revenue")} value={formatPrice(stats.revenue)} icon={Euro} tone="success" delay={0.05} />
        <StatCard label={t("admin.stat.avgOrder")} value={formatPrice(stats.averageOrderValue)} icon={TrendingUp} delay={0.1} />
        <StatCard label={t("admin.stat.cancelled")} value={stats.cancelled} icon={XCircle} tone="warning" delay={0.15} />
        <StatCard label={t("admin.stat.onlinePaid")} value={stats.onlinePaid} hint={formatPrice(stats.onlineRevenue)} icon={CreditCard} delay={0.2} />
        <StatCard label={t("admin.stat.cash")} value={stats.cash} hint={formatPrice(stats.cashRevenue)} icon={Wallet} delay={0.25} />
        <StatCard label={t("admin.stat.pickup")} value={stats.pickup} icon={ShoppingBag} delay={0.3} />
        <StatCard label={t("admin.stat.delivery")} value={stats.delivery} icon={Bike} delay={0.35} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Panel title={t("admin.sales.byDay")}>
          {stats.orders === 0 ? (
            <EmptyState title={t("admin.sales.empty")} icon={PackageSearch} />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#948B83" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#948B83" }} width={56} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    contentStyle={{ borderRadius: 14, border: "1px solid #332D29", background: "#181413", color: "#F5F4F3", fontSize: 13 }}
                    formatter={(value: number) => [formatPrice(value), t("admin.sales.revenue")]}
                  />
                  <Bar dataKey="revenue" fill="#E5713C" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title={t("admin.sales.topProducts")}>
          {best.length === 0 ? (
            <EmptyState title={t("admin.sales.empty")} icon={PackageSearch} />
          ) : (
            <ol className="space-y-3">
              {best.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted font-display text-xs font-extrabold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{tr(product.name)}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-secondary"
                        style={{ width: `${(product.quantity / best[0].quantity) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold tabular-nums">{product.quantity}×</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{formatPrice(product.revenue)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
};

export default AdminSales;
