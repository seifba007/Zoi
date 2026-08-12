import { LogoMark } from "@/components/brand/Logo";
import { useI18n } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

/**
 * Full-screen loading state for lazily loaded routes.
 *
 * A grey box says "something is broken"; the brand mark under a turning ring
 * says "we are getting there". It sits on the same dark surface as the footer
 * and the mobile navigation, so a slow connection never breaks the mood.
 *
 * Everything animated is switched off under prefers-reduced-motion, where the
 * bar simply rests at a third of its track.
 */
export const RouteLoader = ({ className }: { className?: string }) => {
  const { t } = useI18n();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "surface-dark grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-900 px-6 text-cream-100",
        className
      )}
    >
      {/* the same warm glows the footer uses, so this reads as part of the site */}
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-ember-600/20 blur-[90px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-basil-500/15 blur-[90px]" />

      <div className="relative flex flex-col items-center">
        {/* mark inside a ring that turns once every 1.6s */}
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute -inset-3 rounded-full border-2 border-white/[0.07]" />
          <span
            aria-hidden="true"
            className="absolute -inset-3 animate-spin rounded-full border-2 border-transparent border-r-basil-400 border-t-ember-400 [animation-duration:1.6s] motion-reduce:animate-none"
          />
          <LogoMark className="h-16 w-16 rounded-[1.35rem]" />
        </span>

        <span className="mt-6 font-display text-[1.7rem] font-extrabold lowercase leading-none tracking-[-0.035em]">
          zoi
        </span>

        {/* indeterminate track — no fake percentage, because we don't know one */}
        <div className="relative mt-7 h-[3px] w-44 overflow-hidden rounded-full bg-white/10">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1/3 animate-sweep rounded-full bg-gradient-to-r from-ember-500 via-ember-400 to-basil-400 motion-reduce:hidden"
          />
          <span
            aria-hidden="true"
            className="hidden h-full w-1/3 rounded-full bg-basil-400 motion-reduce:block"
          />
        </div>

        <span className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-cream-100/40">
          {t("common.loading")}
        </span>
      </div>
    </div>
  );
};
