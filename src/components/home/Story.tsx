import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "@/components/shared/Reveal";
import { useI18n } from "@/i18n/LanguageProvider";
import { useStore } from "@/context/StoreProvider";

const STORY_IMAGE = "/our-story-Cbe65kiZ.webp";

/**
 * About section.
 *
 * Two equal columns so neither side leaves a dead zone: the photograph fills
 * its half, and the copy fills its half at a measure that stays readable
 * because the column — not an arbitrary max-width — sets the line length.
 */
export const Story = () => {
  const { t } = useI18n();
  const { settings } = useStore();
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], reduced ? ["0%", "0%"] : ["-4%", "4%"]);

  const stats = [
    { value: "24", label: t("story.stat.marinated") },
    { value: "100%", label: t("story.stat.daily") },
    { value: "3.400", label: t("story.stat.guests") },
  ];

  return (
    <section
      id="about"
      ref={container}
      className="relative overflow-hidden bg-muted/30 py-14 md:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[26rem] w-[26rem] rounded-full bg-ember-700/10 blur-[120px]" />

      <div className="container-width relative">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          {/* ---------------------------------------------------- image */}
          <Reveal className="order-2 lg:order-1">
            <figure className="relative mx-auto w-full max-w-[26rem] lg:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-white/10 sm:aspect-[5/4] lg:aspect-[4/5]">
                <motion.img
                  src={STORY_IMAGE}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  style={{ y: imageY }}
                  className="h-[108%] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/5 to-transparent" />

                {/* founding caption, sized to its content */}
                <figcaption className="absolute bottom-5 left-5 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-950/60 px-4 py-2.5 backdrop-blur-xl">
                  <span className="font-display text-lg font-extrabold leading-none text-basil-300">
                    2019
                  </span>
                  <span className="text-[0.7rem] leading-none text-cream-100/60">
                    {settings.address.city}
                  </span>
                </figcaption>
              </div>
            </figure>
          </Reveal>

          {/* ----------------------------------------------------- copy */}
          <div className="order-1 lg:order-2">
            <Reveal>
              <span className="eyebrow">
                <span className="h-px w-8 bg-basil-400" />
                {t("story.eyebrow")}
              </span>
              <h2 className="display-xl mt-5 text-[clamp(1.9rem,3.6vw,2.9rem)]">
                {t("story.title")}
              </h2>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-6 space-y-4 text-[0.98rem] leading-relaxed text-muted-foreground">
                <p>{t("story.p1")}</p>
                <p>{t("story.p2")}</p>
              </div>
            </Reveal>

            {/* stats sit on a rule so the column ends on a defined edge */}
            <Reveal delay={0.18}>
              <dl className="mt-9 grid grid-cols-3 gap-6 border-t border-border pt-7 sm:gap-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-display text-2xl font-extrabold leading-none text-basil-300 sm:text-[1.75rem]">
                      {stat.value}
                    </dt>
                    <dd className="mt-2 text-xs leading-snug text-muted-foreground">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
