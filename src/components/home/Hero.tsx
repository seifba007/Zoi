import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bike, ShoppingBag, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpenStatusBadge } from "@/components/shared/OpenStatusBadge";
import { useI18n } from "@/i18n/LanguageProvider";
import { useStore } from "@/context/StoreProvider";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { HeroShowcase } from "./HeroShowcase";

const HERO_IMAGE = "/hero-bg-Cg_jqEvL.webp";

export const Hero = () => {
  const { t } = useI18n();
  const { settings } = useStore();
  const { isOpen } = useOpeningStatus();
  const prefersReduced = useReducedMotion();

  const fadeUp = (delay: number) =>
    prefersReduced
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section
      id="home"
      className="surface-dark grain relative isolate flex min-h-[92svh] items-center overflow-hidden bg-ink-950 pt-24 text-cream-100 lg:pt-20"
    >
      {/* photography + warmth */}
      <div className="absolute inset-0 -z-20">
        <img
          src={HERO_IMAGE}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-40"
          fetchPriority="high"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_15%_20%,rgba(15,12,11,0.72),rgba(8,6,6,0.96))]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 -z-10 h-[28rem] w-[28rem] rounded-full bg-ember-700/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-[26rem] w-[26rem] rounded-full bg-basil-600/15 blur-[100px]" />

      <div className="container-width relative w-full py-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* ------------------------------------------------------ copy */}
          <div className="max-w-2xl">
            <motion.div {...fadeUp(0)} className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-basil-200 ring-1 ring-white/10 backdrop-blur">
                <Flame className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </span>
              <OpenStatusBadge inverted />
            </motion.div>

            <motion.h1
              {...fadeUp(0.08)}
              className="display-xl mt-7 text-[clamp(2.75rem,8vw,5.5rem)]"
            >
              {t("hero.title.line1")}
              <br />
              <span className="bg-gradient-to-r from-basil-200 via-basil-400 to-ember-400 bg-clip-text text-transparent">
                {t("hero.title.line2")}
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.16)}
              className="mt-6 max-w-xl text-base leading-relaxed text-cream-100/70 sm:text-lg"
            >
              {t("hero.description")}
            </motion.p>

            {/* pickup / delivery */}
            <motion.div {...fadeUp(0.24)} className="mt-7 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium text-cream-100/85 ring-1 ring-white/10">
                <ShoppingBag className="h-4 w-4 text-basil-300" />
                {t("status.pickup")} · {t("status.pickupTime", { minutes: settings.prepTimeMinutes })}
              </span>
              {settings.delivery.enabled && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium text-cream-100/85 ring-1 ring-white/10">
                  <Bike className="h-4 w-4 text-basil-300" />
                  {t("status.delivery")} · {t("status.deliveryTime", { minutes: settings.deliveryTimeMinutes })}
                </span>
              )}
            </motion.div>

            {/* Matched widths so the pair reads as one considered unit */}
            <motion.div {...fadeUp(0.32)} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="xl" className="group w-full sm:w-auto sm:min-w-[11.5rem]">
                <Link to="/menu">
                  {t("hero.cta.order")}
                  <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full sm:w-auto sm:min-w-[11.5rem]">
                <Link to="/menu">{t("hero.cta.menu")}</Link>
              </Button>
            </motion.div>

            {!isOpen && (
              <motion.p {...fadeUp(0.4)} className="mt-5 text-sm text-ember-200/90">
                {t("status.orderingClosed")} {t("status.orderingClosedHint")}
              </motion.p>
            )}

            {/* stats */}
            <motion.dl {...fadeUp(0.46)} className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-7">
              {[
                { value: "12", label: t("hero.stat.spices") },
                { value: `${settings.prepTimeMinutes}`, label: t("hero.stat.minutes") },
                { value: "4,9", label: t("hero.stat.rating") },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-3xl font-extrabold text-basil-300">{stat.value}</dt>
                  <dd className="mt-1 text-[0.7rem] leading-snug text-cream-100/55">{stat.label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* ------------------------------------------------ visual */}
          <HeroShowcase />
        </div>
      </div>

      {/* scroll cue */}
      <motion.a
        href="#signature"
        {...fadeUp(0.7)}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-cream-100/40 transition-colors hover:text-cream-100/80 lg:flex"
      >
        {t("hero.scroll")}
        <span className="flex h-9 w-5 items-start justify-center rounded-full border border-current p-1">
          <motion.span
            className="h-1.5 w-1 rounded-full bg-current"
            animate={prefersReduced ? undefined : { y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.a>
    </section>
  );
};
