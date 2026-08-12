import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/menu/ProductCard";
import { Reveal, RevealGroup, revealItem } from "@/components/shared/Reveal";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";

/** The three dishes that convert best — shown straight under the hero. */
export const SignatureDishes = () => {
  const { products } = useStore();
  const { t } = useI18n();

  const featured = products
    .filter((product) => product.tags.includes("popular") && product.available)
    .slice(0, 6);

  if (featured.length === 0) return null;

  return (
    <section id="signature" className="section-padding relative">
      <div className="container-width">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-xl">
            <span className="eyebrow">
              <span className="h-px w-8 bg-basil-400" />
              {t("signature.eyebrow")}
            </span>
            <h2 className="display-xl mt-4 text-[clamp(2rem,5vw,3.25rem)]">{t("signature.title")}</h2>
            <p className="mt-4 text-muted-foreground">{t("signature.subtitle")}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <Button asChild variant="outline" size="lg" className="group">
              <Link to="/menu">
                {t("signature.all")}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Reveal>
        </div>

        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <motion.div key={product.id} variants={revealItem}>
              <ProductCard product={product} featured />
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};
