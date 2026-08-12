import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { OpenStatusBadge } from "@/components/shared/OpenStatusBadge";
import { useI18n } from "@/i18n/LanguageProvider";
import { useStore } from "@/context/StoreProvider";
import { TranslationKey } from "@/i18n/translations";

const SOCIALS = [
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
];

export const SiteFooter = () => {
  const { t, tr } = useI18n();
  const { settings, categories } = useStore();
  const year = new Date().getFullYear();

  const uniqueHours = settings.hours.filter((day) => day.open);
  const allSame =
    uniqueHours.length === 7 &&
    uniqueHours.every((day) => day.from === uniqueHours[0].from && day.to === uniqueHours[0].to);

  return (
    <footer className="surface-dark grain relative overflow-hidden bg-ink-900 text-cream-100">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-ember-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-basil-600/10 blur-3xl" />

      <div className="container-width relative py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* brand */}
          <div className="space-y-6">
            <Wordmark markClassName="h-14 w-14 rounded-2xl" />
            <p className="max-w-xs text-sm leading-relaxed text-cream-100/65">{t("footer.tagline")}</p>
            <OpenStatusBadge inverted />
            <div className="flex gap-3">
              {SOCIALS.map(({ name, icon: Icon, href }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.07] text-cream-100/80 ring-1 ring-white/10 transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:ring-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* explore */}
          <nav aria-label={t("footer.explore")}>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-basil-300">
              {t("footer.explore")}
            </h3>
            <ul className="space-y-3 text-sm">
              {(["nav.home", "nav.menu", "nav.about", "nav.contact"] as TranslationKey[]).map((key, index) => (
                <li key={key}>
                  <Link
                    to={index === 1 ? "/menu" : index === 0 ? "/" : index === 2 ? "/#about" : "/#contact"}
                    className="text-cream-100/65 transition-colors hover:text-cream-50"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* categories */}
          <nav aria-label={t("menu.eyebrow")}>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-basil-300">
              {t("menu.eyebrow")}
            </h3>
            <ul className="space-y-3 text-sm">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/menu?category=${category.id}`}
                    className="text-cream-100/65 transition-colors hover:text-cream-50"
                  >
                    {tr(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* contact */}
          <div>
            <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-basil-300">
              {t("nav.contact")}
            </h3>
            <ul className="space-y-4 text-sm text-cream-100/65">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-basil-300" />
                <span>
                  {settings.address.street}
                  <br />
                  {settings.address.zip} {settings.address.city}
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-basil-300" />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-cream-50">
                  {settings.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-basil-300" />
                <a href={`mailto:${settings.email}`} className="hover:text-cream-50">
                  {settings.email}
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-basil-300" />
                <span>
                  {allSame ? (
                    <>
                      {t("contact.daily")} {uniqueHours[0].from}–{uniqueHours[0].to}
                    </>
                  ) : (
                    settings.hours.map((day) => (
                      <span key={day.weekday} className="block">
                        {t(`day.short.${day.weekday}` as TranslationKey)}{" "}
                        {day.open ? `${day.from}–${day.to}` : t("status.closed")}
                      </span>
                    ))
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-cream-100/45">
            © {year} Zoi. {t("footer.rights")}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-cream-100/45">
            <span className="cursor-default transition-colors hover:text-cream-100/80">{t("footer.imprint")}</span>
            <span className="cursor-default transition-colors hover:text-cream-100/80">{t("footer.privacy")}</span>
            <span className="cursor-default transition-colors hover:text-cream-100/80">{t("footer.terms")}</span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 transition-colors hover:text-basil-300"
            >
              {t("footer.admin")}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
            <LanguageSwitcher inverted layoutId="language-pill-footer" />
          </div>
        </div>
      </div>
    </footer>
  );
};
