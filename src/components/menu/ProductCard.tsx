import { motion } from "framer-motion";
import { Plus, Flame, Leaf, Star, Sparkles } from "lucide-react";
import { Product, ProductTag } from "@/types";
import { ProductImage } from "@/components/shared/ProductImage";
import { useI18n } from "@/i18n/LanguageProvider";
import { useProductModal } from "@/context/ProductModalProvider";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

const TAG_STYLES: Record<ProductTag, { icon: typeof Flame; className: string; key: TranslationKey }> = {
  popular: { icon: Star, className: "bg-ink-900/85 text-cream-100", key: "menu.popular" },
  spicy: { icon: Flame, className: "bg-ember-600/90 text-white", key: "menu.spicy" },
  vegetarian: { icon: Leaf, className: "bg-emerald-700/85 text-white", key: "menu.vegetarian" },
  new: { icon: Sparkles, className: "bg-basil-400/95 text-ink-900", key: "menu.new" },
};

export const ProductCard = ({ product, featured = false }: { product: Product; featured?: boolean }) => {
  const { t, tr, formatPrice } = useI18n();
  const { openProduct } = useProductModal();

  const unavailable = !product.available;

  // Opens the product sheet so extras, quantity and notes are always one step away
  const openCustomise = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (unavailable) return;
    openProduct(product);
  };

  return (
    <motion.article
      whileHover={unavailable ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card text-left shadow-soft transition-shadow duration-300",
        !unavailable && "hover:shadow-lift",
        unavailable && "opacity-85"
      )}
    >
      <button
        type="button"
        onClick={() => openProduct(product)}
        aria-label={tr(product.name)}
        className="flex h-full flex-col text-left focus-visible:outline-none"
      >
        {/* image */}
        <div className={cn("relative overflow-hidden", featured ? "aspect-[4/3]" : "aspect-[5/4]")}>
          <div className={cn("h-full w-full transition-transform duration-700 group-hover:scale-105", unavailable && "grayscale")}>
            <ProductImage src={product.image} name={product.name} seed={product.id} />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-transparent" />

          {/* tags */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.tags.map((tag) => {
              const style = TAG_STYLES[tag];
              const Icon = style.icon;
              return (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide backdrop-blur",
                    style.className
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {t(style.key)}
                </span>
              );
            })}
          </div>

          {/* price */}
          <span className="absolute bottom-3 left-3 rounded-full bg-cream-50/95 px-3 py-1.5 font-display text-sm font-extrabold text-ink-900 shadow-sm backdrop-blur">
            {formatPrice(product.price)}
          </span>

          {unavailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-950/45 backdrop-blur-[2px]">
              <span className="rounded-full bg-cream-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-900">
                {t("menu.unavailable")}
              </span>
            </div>
          )}
        </div>

        {/* body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-display text-lg font-bold leading-tight">{tr(product.name)}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {tr(product.description)}
          </p>

          <div className="mt-4 flex items-center justify-between pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-basil-300">
              {unavailable ? t("menu.unavailable") : t("menu.customize")}
            </span>
          </div>
        </div>
      </button>

      {/* quick add */}
      <button
        type="button"
        onClick={openCustomise}
        disabled={unavailable}
        aria-label={`${t("menu.customize")}: ${tr(product.name)}`}
        className={cn(
          "absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full shadow-soft transition-all duration-200",
          unavailable
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:scale-110 hover:shadow-glow active:scale-95"
        )}
      >
        <Plus className="h-5 w-5" />
      </button>
    </motion.article>
  );
};
