import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  ReceiptText, Euro, ChefHat, Bike, ShoppingBag, XCircle, TrendingUp, Clock,
} from "lucide-react";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { activeOrders, endOfDay, filterByRange, startOfDay, summarize } from "@/services/analytics";
import { cn } from "@/lib/utils";

/**
 * Live pulse of the restaurant, sitting inside the admin header next to the
 * language switcher and flexing into whatever width is left over.
 *
 * The row scrolls on its own so every metric gets seen without the staff having
 * to swipe. It pauses on hover and stops entirely for reduced-motion users.
 */
export const AdminStatsBar = ({ className }: { className?: string }) => {
  const { orders } = useStore();
  const { t, formatPrice } = useI18n();
  const { isOpen, label: openingLabel } = useOpeningStatus();
  const reduced = useReducedMotion();

  const stats = useMemo(() => {
    const today = filterByRange(orders, startOfDay(new Date()), endOfDay(new Date()));
    const summary = summarize(today);
    const active = activeOrders(orders).length;

    return [
      { icon: ReceiptText, value: summary.orders, label: t("admin.stat.ordersToday"), tone: "text-ember-300" },
      { icon: Euro, value: formatPrice(summary.revenue), label: t("admin.stat.revenueToday"), tone: "text-success" },
      { icon: ChefHat, value: active, label: t("admin.dashboard.active"), tone: "text-basil-300" },
      { icon: ShoppingBag, value: summary.pickup, label: t("admin.stat.pickup"), tone: "text-sky-300" },
      { icon: Bike, value: summary.delivery, label: t("admin.stat.delivery"), tone: "text-indigo-300" },
      { icon: TrendingUp, value: formatPrice(summary.averageOrderValue), label: t("admin.stat.avgOrder"), tone: "text-emerald-300" },
      { icon: XCircle, value: summary.cancelled, label: t("admin.stat.cancelled"), tone: "text-red-300" },
      {
        icon: Clock,
        value: isOpen ? t("status.open") : t("status.closed"),
        label: openingLabel,
        tone: isOpen ? "text-success" : "text-basil-300",
      },
    ];
  }, [orders, t, formatPrice, isOpen, openingLabel]);

  // duplicated once so the loop can wrap seamlessly at -50%
  const track = reduced ? stats : [...stats, ...stats];

  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        className={cn(
          "no-scrollbar flex items-center",
          reduced ? "overflow-x-auto" : "overflow-hidden"
        )}
      >
        <div
          className={cn(
            "flex w-max items-center",
            !reduced && "animate-ticker hover:[animation-play-state:paused]"
          )}
        >
          {track.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={`${stat.label}-${index}`}
                className="flex shrink-0 items-center gap-2 border-r border-border/50 px-4"
              >
                <Icon className={cn("h-4 w-4 shrink-0", stat.tone)} />
                <span className="whitespace-nowrap text-xs">
                  <span className="font-bold tabular-nums text-foreground">{stat.value}</span>{" "}
                  <span className="text-muted-foreground">{stat.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* fade the ticker out before it reaches the neighbouring controls */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
};
