import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/menu/ProductCard";
import { OpenStatusBadge } from "@/components/shared/OpenStatusBadge";
import { Reveal } from "@/components/shared/Reveal";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { cn } from "@/lib/utils";

const ALL = "all";

const MenuPage = () => {
  const { categories, products, ready } = useStore();
  const { t, tr } = useI18n();
  const { isOpen, label } = useOpeningStatus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get("category") ?? ALL);
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the category in the URL so links like /menu?category=cat-burger work
  useEffect(() => {
    const fromUrl = searchParams.get("category");
    if (fromUrl && fromUrl !== activeCategory) setActiveCategory(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const selectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchParams(categoryId === ALL ? {} : { category: categoryId }, { replace: true });
  };

  const normalizedQuery = query.trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    const matches = (categoryId: string) => {
      const inCategory = products.filter((product) => product.categoryId === categoryId);
      if (!normalizedQuery) return inCategory;
      return inCategory.filter((product) =>
        `${tr(product.name)} ${tr(product.description)}`.toLowerCase().includes(normalizedQuery)
      );
    };

    return categories
      .filter((category) => activeCategory === ALL || category.id === activeCategory)
      .map((category) => ({ category, items: matches(category.id) }))
      .filter((group) => group.items.length > 0);
  }, [categories, products, activeCategory, normalizedQuery, tr]);

  const totalVisible = visibleCategories.reduce((sum, group) => sum + group.items.length, 0);

  const resetFilters = () => {
    setQuery("");
    selectCategory(ALL);
  };

  return (
    <div className="pt-[4.5rem] lg:pt-20">
      {/* ------------------------------------------------------------ head */}
      <section className="surface-dark grain relative overflow-hidden bg-ink-900 pb-14 pt-14 text-cream-100 md:pb-16 md:pt-20">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-ember-700/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-basil-600/15 blur-3xl" />

        <div className="container-width relative">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="eyebrow text-basil-300">
                <span className="h-px w-8 bg-basil-400" />
                {t("menu.eyebrow")}
              </span>
              <h1 className="display-xl mt-4 text-[clamp(2.25rem,6vw,4rem)]">{t("menu.title")}</h1>
              <p className="mt-4 max-w-lg text-cream-100/65">{t("menu.subtitle")}</p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <OpenStatusBadge inverted />
              <p className="text-sm text-cream-100/50">{t("menu.items", { count: products.length })}</p>
            </div>
          </div>

          {!isOpen && (
            <div className="mt-8 flex flex-col gap-2 rounded-3xl border border-ember-400/25 bg-ember-400/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-base font-bold text-ember-200">
                  {t("status.orderingClosed")}
                </p>
                <p className="mt-1 text-sm text-cream-100/60">{t("status.orderingClosedHint")}</p>
              </div>
              <span className="shrink-0 rounded-full bg-ember-400/15 px-4 py-2 text-sm font-semibold text-ember-200">
                {label}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* --------------------------------------------------------- filters */}
      <div className="sticky top-[4.5rem] z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl lg:top-20">
        <div className="container-width py-3.5">
          <div className="flex items-center gap-3">
            <div
              ref={railRef}
              className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto scroll-smooth"
              role="tablist"
              aria-label={t("menu.eyebrow")}
            >
              {[{ id: ALL, name: { de: t("menu.all"), en: t("menu.all") } }, ...categories].map((category) => {
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectCategory(category.id)}
                    className={cn(
                      "relative shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                      active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="category-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 -z-10 rounded-full bg-primary"
                      />
                    )}
                    {tr(category.name)}
                  </button>
                );
              })}
            </div>

            {/* search */}
            <div className="relative hidden shrink-0 sm:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("menu.search")}
                aria-label={t("menu.search")}
                className="h-11 w-56 rounded-full border border-input bg-card pl-10 pr-4 text-sm transition-all duration-200 focus:w-64 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
          </div>

          {/* mobile search */}
          <div className="relative mt-3 sm:hidden">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("menu.search")}
              aria-label={t("menu.search")}
              className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={t("common.close")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- products */}
      <div className="container-width pb-24 pt-10 md:pb-28">
        {!ready ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="skeleton aspect-[5/4] rounded-3xl" />
                <div className="skeleton h-5 w-2/3 rounded-lg" />
                <div className="skeleton h-4 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : totalVisible === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-4xl border border-dashed border-border py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">{t("menu.empty.title")}</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("menu.empty.text")}</p>
            </div>
            <Button variant="outline" onClick={resetFilters}>
              {t("menu.empty.reset")}
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            <AnimatePresence mode="popLayout">
              {visibleCategories.map(({ category, items }) => (
                <motion.section
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  id={category.id}
                  className="scroll-mt-40"
                >
                  <Reveal className="mb-7 flex items-end justify-between gap-6 border-b border-border pb-4">
                    <div>
                      <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                        {tr(category.name)}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">{tr(category.tagline)}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {items.length}
                    </span>
                  </Reveal>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;
