import { motion } from "framer-motion";
import { LANGUAGES } from "@/i18n/translations";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/** DE / EN toggle with a sliding indicator. */
export const LanguageSwitcher = ({
  className,
  inverted = false,
  layoutId = "language-pill",
}: {
  className?: string;
  inverted?: boolean;
  layoutId?: string;
}) => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={cn(
        "relative flex items-center rounded-full p-1",
        inverted ? "bg-white/10 ring-1 ring-white/15" : "bg-foreground/[0.06] ring-1 ring-border/70",
        className
      )}
    >
      {LANGUAGES.map(({ code, label, name }) => {
        const isActive = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-label={name}
            aria-pressed={isActive}
            className={cn(
              "relative z-10 rounded-full px-3 py-1 text-xs font-bold tracking-wider transition-colors duration-200",
              isActive
                ? inverted
                  ? "text-ink-900"
                  : "text-primary-foreground"
                : inverted
                  ? "text-white/70 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className={cn(
                  "absolute inset-0 -z-10 rounded-full",
                  inverted ? "bg-cream-100" : "bg-primary"
                )}
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
};
