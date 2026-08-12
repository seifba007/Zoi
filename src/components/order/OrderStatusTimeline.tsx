import { motion } from "framer-motion";
import { Check, XCircle, ChefHat, Bike, PackageCheck, ClipboardList, Flame } from "lucide-react";
import { DELIVERY_FLOW, OrderStatus, OrderType, PICKUP_FLOW } from "@/types";
import { useI18n } from "@/i18n/LanguageProvider";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const ICONS: Record<OrderStatus, typeof Check> = {
  new: ClipboardList,
  accepted: Check,
  preparing: ChefHat,
  ready: PackageCheck,
  on_the_way: Bike,
  completed: Flame,
  delivered: PackageCheck,
  cancelled: XCircle,
};

/** Animated progress rail — pickup and delivery have different journeys. */
export const OrderStatusTimeline = ({
  status,
  type,
  compact = false,
}: {
  status: OrderStatus;
  type: OrderType;
  compact?: boolean;
}) => {
  const { t } = useI18n();
  const flow = type === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW;

  if (status === "cancelled") {
    return (
      <div className="flex items-start gap-4 rounded-3xl border border-destructive/25 bg-destructive/[0.06] p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-base font-bold text-destructive">{t("orderStatus.cancelled")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("orderStatus.cancelledText")}</p>
        </div>
      </div>
    );
  }

  const currentIndex = Math.max(0, flow.indexOf(status));
  const progress = flow.length > 1 ? (currentIndex / (flow.length - 1)) * 100 : 0;

  return (
    <div className={cn("relative", compact ? "py-1" : "py-2")}>
      {/* rail */}
      <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-muted" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="relative flex justify-between">
        {flow.map((step, index) => {
          const Icon = ICONS[step];
          const done = index < currentIndex;
          const active = index === currentIndex;

          return (
            <li key={step} className="flex flex-1 flex-col items-center gap-2 text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 400, damping: 24 }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full ring-4 ring-background transition-colors duration-500",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary/35"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
                {done ? <Check className="relative h-4 w-4" /> : <Icon className="relative h-4 w-4" />}
              </motion.span>

              <span
                className={cn(
                  "max-w-[5.5rem] text-[0.7rem] font-semibold leading-tight sm:text-xs",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(`orderStatus.${step}` as TranslationKey)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
