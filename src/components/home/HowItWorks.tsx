import { motion } from "framer-motion";
import { UtensilsCrossed, Bike, PartyPopper } from "lucide-react";
import { Reveal, RevealGroup, revealItem } from "@/components/shared/Reveal";
import { useI18n } from "@/i18n/LanguageProvider";
import { TranslationKey } from "@/i18n/translations";

const STEPS: { icon: typeof Bike; title: TranslationKey; text: TranslationKey }[] = [
  { icon: UtensilsCrossed, title: "steps.1.title", text: "steps.1.text" },
  { icon: Bike, title: "steps.2.title", text: "steps.2.text" },
  { icon: PartyPopper, title: "steps.3.title", text: "steps.3.text" },
];

/** Three-step explainer on a charcoal band — breaks up the cream page. */
export const HowItWorks = () => {
  const { t } = useI18n();

  return (
    <section className="surface-dark grain relative overflow-hidden bg-ink-900 py-16 text-cream-100 md:py-24">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-ember-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-basil-600/10 blur-3xl" />

      <div className="container-width relative">
        <Reveal className="max-w-2xl">
          <span className="eyebrow text-basil-300">
            <span className="h-px w-8 bg-basil-400" />
            {t("steps.eyebrow")}
          </span>
          <h2 className="display-xl mt-4 text-[clamp(2rem,5vw,3.25rem)]">{t("steps.title")}</h2>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <motion.div
              key={title}
              variants={revealItem}
              className="group relative rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition-colors duration-300 hover:border-basil-400/40 hover:bg-white/[0.06]"
            >
              <span className="absolute right-6 top-6 font-display text-5xl font-extrabold text-white/[0.06] transition-colors duration-300 group-hover:text-basil-400/20">
                0{index + 1}
              </span>

              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-basil-300 ring-1 ring-primary/25">
                <Icon className="h-5 w-5" />
              </span>

              <h3 className="mt-5 font-display text-xl font-bold">{t(title)}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-cream-100/60">{t(text)}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};
