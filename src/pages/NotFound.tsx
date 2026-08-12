import { Link } from "react-router-dom";
import { Home, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/LanguageProvider";

const NotFound = () => {
  const { t } = useI18n();

  return (
    <div className="surface-dark grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-6 text-center text-cream-100">
      <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-ember-700/25 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-basil-600/15 blur-[100px]" />

      <p className="relative font-display text-[clamp(5rem,20vw,12rem)] font-extrabold leading-none text-white/[0.07]">
        404
      </p>
      <h1 className="relative -mt-8 font-display text-3xl font-extrabold sm:text-4xl">
        {t("notFound.title")}
      </h1>
      <p className="relative mt-4 max-w-md text-cream-100/60">{t("notFound.text")}</p>

      <div className="relative mt-9 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link to="/">
            <Home />
            {t("notFound.cta")}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-white/25 text-cream-100 hover:bg-white/10">
          <Link to="/menu">
            <UtensilsCrossed />
            {t("nav.menu")}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
