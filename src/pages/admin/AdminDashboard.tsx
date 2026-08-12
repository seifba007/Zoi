import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ReceiptText, Euro, CreditCard, Wallet, Bike, ShoppingBag,
  XCircle, TrendingUp, ChefHat, ArrowRight,
} from "lucide-react";
import { EmptyState, OrderStatusChip, PageHeader, Panel, StatCard } from "@/components/admin/AdminUI";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  activeOrders, endOfDay, ordersByHour, revenueByDay, startOfDay, summarize, filterByRange,
} from "@/services/analytics";

// Chart palette tuned for the charcoal dashboard
const BRAND = {
  ember: "#E5713C",
  basil: "#73A455",
  axis: "#948B83",
  grid: "rgba(255,255,255,0.07)",
};

const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid #332D29",
  background: "#181413",
  color: "#F5F4F3",
  fontSize: 13,
} as const;

const AdminDashboard = () => {
  const { orders } = useStore();
  const { t, tr, formatPrice, formatTime, locale } = useI18n();

  const today = useMemo(() => filterByRange(orders, startOfDay(new Date()), endOfDay(new Date())), [orders]);
  const stats = useMemo(() => summarize(today), [today]);
  const active = useMemo(() => activeOrders(orders), [orders]);
  const recent = useMemo(() => orders.slice(0, 6), [orders]);

  const revenueSeries = useMemo(
    () =>
      revenueByDay(orders, 7).map((entry) => ({
        ...entry,
        label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(entry.date),
      })),
    [orders, locale]
  );

  const hourSeries = useMemo(() => ordersByHour(orders.slice(0, 200)), [orders]);

  const typeSeries = useMemo(
    () => [
      { name: t("status.pickup"), value: stats.pickup, color: BRAND.ember },
      { name: t("status.delivery"), value: stats.delivery, color: BRAND.basil },
    ],
    [stats.pickup, stats.delivery, t]
  );

  return (
    <>
      <PageHeader title={t("admin.dashboard.title")} subtitle={t("admin.dashboard.subtitle")} />

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("admin.stat.ordersToday")} value={stats.orders} icon={ReceiptText} tone="primary" delay={0} />
        <StatCard label={t("admin.stat.revenueToday")} value={formatPrice(stats.revenue)} icon={Euro} tone="success" delay={0.05} />
        <StatCard label={t("admin.stat.avgOrder")} value={formatPrice(stats.averageOrderValue)} icon={TrendingUp} delay={0.1} />
        <StatCard label={t("admin.stat.cancelled")} value={stats.cancelled} icon={XCircle} tone="warning" delay={0.15} />
        <StatCard label={t("admin.stat.onlinePaid")} value={stats.onlinePaid} hint={formatPrice(stats.onlineRevenue)} icon={CreditCard} delay={0.2} />
        <StatCard label={t("admin.stat.cash")} value={stats.cash} hint={formatPrice(stats.cashRevenue)} icon={Wallet} delay={0.25} />
        <StatCard label={t("admin.stat.delivery")} value={stats.delivery} icon={Bike} delay={0.3} />
        <StatCard label={t("admin.stat.pickup")} value={stats.pickup} icon={ShoppingBag} delay={0.35} />
      </div>

      {/* charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title={t("admin.dashboard.salesChart")} className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND.ember} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={BRAND.ember} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: BRAND.axis }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: BRAND.axis }} width={56} />
                <Tooltip
                  cursor={{ stroke: BRAND.axis, strokeDasharray: 4 }}
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number) => [formatPrice(value), t("admin.sales.revenue")]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={BRAND.ember}
                  strokeWidth={2.5}
                  fill="url(#revenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title={t("admin.dashboard.typeChart")}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeSeries}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {typeSeries.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {typeSeries.map((entry) => (
              <li key={entry.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
                <span className="flex-1 text-muted-foreground">{entry.name}</span>
                <span className="font-bold tabular-nums">{entry.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title={t("admin.dashboard.hourChart")} className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourSeries} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: BRAND.axis }} interval={1} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: BRAND.axis }} width={54} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Bar dataKey="orders" fill={BRAND.basil} radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* active orders */}
        <Panel
          title={t("admin.dashboard.active")}
          actions={
            <Link to="/admin/orders" className="text-xs font-semibold text-basil-300 hover:underline">
              {t("admin.nav.orders")}
            </Link>
          }
        >
          {active.length === 0 ? (
            <EmptyState title={t("admin.dashboard.noActive")} icon={ChefHat} />
          ) : (
            <ul className="space-y-3">
              {active.slice(0, 5).map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/orders?order=${order.number}`}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 p-3 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      {order.type === "delivery" ? <Bike className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{order.number}</p>
                      <p className="truncate text-xs text-muted-foreground">{order.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <OrderStatusChip status={order.status} />
                      <p className="mt-1 text-[0.7rem] text-muted-foreground">
                        {formatTime(order.estimatedReadyAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* recent orders */}
      <Panel
        title={t("admin.dashboard.recent")}
        className="mt-4"
        actions={
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-basil-300 hover:underline"
          >
            {t("admin.orders.all")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        }
      >
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                <th className="px-2 pb-3 font-bold">#</th>
                <th className="px-2 pb-3 font-bold">{t("admin.orders.customer")}</th>
                <th className="px-2 pb-3 font-bold">{t("confirm.type")}</th>
                <th className="px-2 pb-3 font-bold">{t("admin.orders.createdAt")}</th>
                <th className="px-2 pb-3 text-right font-bold">{t("cart.total")}</th>
                <th className="px-2 pb-3 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {recent.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-2 py-3 font-bold">{order.number}</td>
                  <td className="px-2 py-3">
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length}× {tr(order.items[0]?.name ?? { de: "", en: "" })}
                    </p>
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {t(order.type === "delivery" ? "status.delivery" : "status.pickup")}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground tabular-nums">{formatTime(order.createdAt)}</td>
                  <td className="px-2 py-3 text-right font-bold tabular-nums">{formatPrice(order.total)}</td>
                  <td className="px-2 py-3 text-right">
                    <OrderStatusChip status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
};

export default AdminDashboard;
