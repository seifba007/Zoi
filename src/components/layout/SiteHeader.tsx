import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CartButton } from "./CartButton";
import { OpenStatusBadge } from "@/components/shared/OpenStatusBadge";
import { useI18n } from "@/i18n/LanguageProvider";
import { useStore } from "@/context/StoreProvider";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

type NavItem = { key: TranslationKey; to: string; hash?: string };

const NAV_ITEMS: NavItem[] = [
  { key: "nav.home", to: "/" },
  { key: "nav.menu", to: "/menu" },
  { key: "nav.about", to: "/", hash: "about" },
  { key: "nav.contact", to: "/", hash: "contact" },
];

export const SiteHeader = () => {
  const { t } = useI18n();
  const { settings } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === "/";
  // Only the home hero is dark enough to carry a transparent header
  const transparent = isHome && !scrolled && !mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the overlay on navigation and lock scrolling while it is open
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const goTo = (item: NavItem) => {
    setMobileOpen(false);
    if (!item.hash) {
      navigate(item.to);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (location.pathname === item.to) {
      document.getElementById(item.hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`${item.to}#${item.hash}`);
    }
  };

  const isActive = (item: NavItem) =>
    item.hash ? false : location.pathname === item.to;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          transparent
            ? "bg-transparent"
            : "border-b border-border/60 bg-background/85 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.02)]"
        )}
      >
        <div className="container-width">
          <div className="flex h-[4.5rem] items-center justify-between gap-4 lg:h-20">
            {/* brand */}
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className={cn(
                "shrink-0 rounded-xl transition-colors",
                transparent ? "text-cream-100" : "text-foreground"
              )}
              aria-label="Zoi"
            >
              {/* the bar grows to 5rem on lg, so the mark grows with it */}
              <Wordmark markClassName="lg:h-[3.25rem] lg:w-[3.25rem] lg:rounded-[1.1rem]" />
            </Link>

            {/* desktop nav */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Hauptnavigation">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => goTo(item)}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn(
                    "group relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                    transparent
                      ? "text-cream-100/80 hover:text-cream-50"
                      : "text-muted-foreground hover:text-foreground",
                    isActive(item) && (transparent ? "text-cream-50" : "text-foreground")
                  )}
                >
                  {t(item.key)}
                  <span
                    className={cn(
                      "absolute bottom-1 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-primary transition-all duration-300",
                      isActive(item) ? "w-5" : "w-0 group-hover:w-5"
                    )}
                  />
                </button>
              ))}
            </nav>

            {/* actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <OpenStatusBadge className="hidden xl:inline-flex" inverted={transparent} compact />
              <LanguageSwitcher className="hidden sm:flex" inverted={transparent} />
              <CartButton inverted={transparent} />

              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link to="/menu">{t("nav.order")}</Link>
              </Button>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={t("nav.openMenu")}
                aria-expanded={mobileOpen}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-colors lg:hidden",
                  transparent
                    ? "bg-white/10 text-cream-100 ring-1 ring-white/15"
                    : "bg-foreground/[0.06] text-foreground ring-1 ring-border/70"
                )}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* full screen mobile navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] lg:hidden"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 32 }}
              className="surface-dark grain relative flex h-full flex-col overflow-y-auto bg-ink-900 text-cream-100"
            >
              {/* warm glow */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ember-600/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-basil-500/15 blur-3xl" />

              <div className="container-width relative flex h-[4.5rem] items-center justify-between">
                <Wordmark />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("nav.closeMenu")}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="container-width relative flex flex-1 flex-col justify-center gap-1 py-10">
                {NAV_ITEMS.map((item, index) => (
                  <motion.button
                    key={item.key}
                    type="button"
                    onClick={() => goTo(item)}
                    initial={{ opacity: 0, y: 26 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-baseline justify-between border-b border-white/10 py-5 text-left"
                  >
                    <span className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                      {t(item.key)}
                    </span>
                    <span className="font-mono text-xs text-cream-100/40">
                      0{index + 1}
                    </span>
                  </motion.button>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="container-width relative space-y-5 pb-10"
              >
                <div className="flex items-center justify-between gap-3">
                  <OpenStatusBadge inverted />
                  <LanguageSwitcher inverted layoutId="language-pill-mobile" />
                </div>

                <Button asChild size="lg" className="w-full">
                  <Link to="/menu">{t("nav.order")}</Link>
                </Button>

                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-cream-100/70 transition-colors hover:text-cream-50"
                >
                  <Phone className="h-4 w-4" />
                  {settings.phone}
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
