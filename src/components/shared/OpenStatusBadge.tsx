import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/**
 * Live ordering status. Green pulse while orders are accepted,
 * amber with the next opening time once the window has passed.
 */
export const OpenStatusBadge = ({
  className,
  inverted = false,
  compact = false,
}: {
  className?: string;
  inverted?: boolean;
  compact?: boolean;
}) => {
  const { isOpen, label } = useOpeningStatus();
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
        inverted
          ? "bg-white/10 text-cream-100 ring-1 ring-white/15 backdrop-blur"
          : isOpen
            ? "bg-success/10 text-success ring-1 ring-success/25"
            : "bg-ember-400/10 text-ember-200 ring-1 ring-ember-400/25",
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {isOpen && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-basil-400 opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            isOpen ? "bg-basil-400" : "bg-ember-400"
          )}
        />
      </span>
      {compact ? (isOpen ? t("status.open") : t("status.closed")) : label}
    </span>
  );
};
