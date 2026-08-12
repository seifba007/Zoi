import { motion } from "framer-motion";
import { ShieldCheck, Flame, Sprout, Wheat } from "lucide-react";
import { RevealGroup, revealItem } from "@/components/shared/Reveal";
import { useI18n } from "@/i18n/LanguageProvider";
import { TranslationKey } from "@/i18n/translations";

/**
 * The four claims that actually sell a grill: sourcing, method, freshness and
 * bread. Sits between the signature dishes and the story as a quiet band —
 * hairline dividers instead of cards, so it reads as a statement of standards
 * rather than another row of tiles.
 */
const PILLARS: { icon: typeof Flame; title: TranslationKey; text: TranslationKey }[] = [
  { icon: ShieldCheck, title: "pillars.halal.title", text: "pillars.halal.text" },
  { icon: Flame, title: "pillars.fire.title", text: "pillars.fire.text" },
  { icon: Sprout, title: "pillars.fresh.title", text: "pillars.fresh.text" },
  { icon: Wheat, title: "pillars.bread.title", text: "pillars.bread.text" },
];

export const QualityPillars = () => {
  const { t } = useI18n();

  return (
    <section className="relative border-y border-border/60 bg-ink-950/40">
      {/* single warm accent so the band is not purely flat */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-basil-500/30 to-transparent" />

      <div className="container-width">
        {/* hairline dividers only where the row is genuinely four across */}
        <RevealGroup className="grid grid-cols-1 gap-y-1 py-4 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-border/60 lg:py-0">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <motion.div
              key={title}
              variants={revealItem}
              className="group flex gap-4 py-6 lg:px-7 lg:py-9 lg:first:pl-0 lg:last:pr-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-basil-400/10 text-basil-300 ring-1 ring-basil-400/15 transition-all duration-300 group-hover:bg-basil-400/20 group-hover:ring-basil-400/30">
                <Icon className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <h3 className="font-display text-base font-bold leading-tight">{t(title)}</h3>
                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
                  {t(text)}
                </p>
              </div>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};
