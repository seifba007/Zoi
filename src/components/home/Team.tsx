import { motion } from "framer-motion";
import { Reveal, RevealGroup, revealItem } from "@/components/shared/Reveal";
import { useI18n } from "@/i18n/LanguageProvider";

/** The people behind the counter. Images live in /public. */
const TEAM = [
  {
    name: "Karim Haddad",
    role: { de: "Küchenchef & Gründer", en: "Head Chef & Founder" },
    bio: {
      de: "Lernte das Handwerk in Beirut, verfeinerte es in Berlin. Karim schneidet noch immer jeden Abend selbst am Spieß.",
      en: "Learned the craft in Beirut, refined it in Berlin. Karim still carves at the spit himself every evening.",
    },
    image: "/chef-1-Y3Tbdns-.webp",
  },
  {
    name: "Noor Salim",
    role: { de: "Saucen & Mezze", en: "Sauces & Mezze" },
    bio: {
      de: "Verantwortlich für alles, was cremig ist. Ihre Knoblauchsauce ist der Grund, warum Gäste wiederkommen.",
      en: "Responsible for everything creamy. Her garlic sauce is the reason guests come back.",
    },
    image: "/chef-2-CetgttF_.webp",
  },
  {
    name: "Mert Aydın",
    role: { de: "Grill & Brot", en: "Grill & Bread" },
    bio: {
      de: "Backt jeden Morgen ab fünf Uhr Fladenbrot im Steinofen — 340 Stück, jeden Tag.",
      en: "Bakes flatbread in the stone oven from five every morning — 340 pieces, every single day.",
    },
    image: "/chef-3-DTo_gWFS.webp",
  },
];

export const Team = () => {
  const { t, tr } = useI18n();

  return (
    <section className="section-padding">
      <div className="container-width">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-px w-8 bg-basil-400" />
            {t("team.eyebrow")}
            <span className="h-px w-8 bg-basil-400" />
          </span>
          <h2 className="display-xl mt-4 text-[clamp(2rem,5vw,3.25rem)]">{t("team.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("team.subtitle")}</p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {TEAM.map((member) => (
            <motion.article
              key={member.name}
              variants={revealItem}
              className="group relative overflow-hidden rounded-4xl bg-ink-900"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
                />
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-transparent p-6 pt-16 text-cream-100">
                <h3 className="font-display text-xl font-bold">{member.name}</h3>
                <p className="mt-0.5 text-sm font-medium text-basil-300">{tr(member.role)}</p>
                <p className="mt-3 max-h-0 overflow-hidden text-sm leading-relaxed text-cream-100/70 opacity-0 transition-all duration-500 group-hover:max-h-32 group-hover:opacity-100">
                  {tr(member.bio)}
                </p>
              </div>
            </motion.article>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};
