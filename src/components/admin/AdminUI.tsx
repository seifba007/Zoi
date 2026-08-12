import React from "react";
import { motion } from "framer-motion";
import { OrderStatus, PaymentStatus } from "@/types";
import { useI18n } from "@/i18n/LanguageProvider";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

/**
 * Small building blocks shared by every admin screen.
 *
 * PageHeader, Panel and StatCard declare the same `adminItem` variants and no
 * initial/animate of their own, so the keyed wrapper in AdminLayout can stagger
 * every block on a page in one place — no per-page choreography.
 */
export const adminItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) => (
  <motion.div
    variants={adminItem}
    className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
  >
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </motion.div>
);

export const Panel = ({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.section
    variants={adminItem}
    className={cn("rounded-3xl border border-border/70 bg-card p-5 shadow-soft sm:p-6", className)}
  >
    {(title || actions) && (
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {title && <h2 className="font-display text-base font-bold">{title}</h2>}
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    )}
    {children}
  </motion.section>
);

export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "success" | "warning";
  /** Kept for call-site compatibility — ordering now comes from the stagger. */
  delay?: number;
}) => {
  const tones = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-ember-300",
    success: "bg-success/15 text-success",
    warning: "bg-ember-400/15 text-ember-300",
  } as const;

  return (
    <motion.div
      variants={adminItem}
      className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-colors duration-300 hover:border-border"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
};

const STATUS_TONES: Record<OrderStatus, string> = {
  new: "bg-primary/15 text-ember-300 ring-primary/25",
  accepted: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
  preparing: "bg-ember-400/15 text-ember-300 ring-ember-400/25",
  ready: "bg-basil-400/15 text-basil-300 ring-basil-400/25",
  on_the_way: "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25",
  completed: "bg-muted text-muted-foreground ring-border",
  delivered: "bg-muted text-muted-foreground ring-border",
  cancelled: "bg-destructive/15 text-red-300 ring-destructive/25",
};

export const OrderStatusChip = ({ status, className }: { status: OrderStatus; className?: string }) => {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-bold ring-1",
        STATUS_TONES[status],
        className
      )}
    >
      {t(`orderStatus.${status}` as TranslationKey)}
    </span>
  );
};

const PAYMENT_TONES: Record<PaymentStatus, string> = {
  pending: "bg-ember-400/15 text-ember-300",
  paid: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-red-300",
  refunded: "bg-muted text-muted-foreground",
};

export const PaymentChip = ({ status }: { status: PaymentStatus }) => {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-bold", PAYMENT_TONES[status])}>
      {t(`payment.status.${status}` as TranslationKey)}
    </span>
  );
};

export const EmptyState = ({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) => (
  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </span>
    <p className="text-sm text-muted-foreground">{title}</p>
  </div>
);

export const AdminField = ({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) => (
  <div className={className}>
    <label className="field-label">{label}</label>
    {children}
    {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const Toggle = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
      checked ? "bg-success" : "bg-muted-foreground/30"
    )}
  >
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className={cn(
        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm",
        checked ? "left-[1.375rem]" : "left-0.5"
      )}
    />
  </button>
);
