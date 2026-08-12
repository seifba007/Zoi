import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Product, SelectedExtra } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/ProductImage";
import { useI18n } from "@/i18n/LanguageProvider";
import { useStore } from "@/context/StoreProvider";
import { useCart } from "@/context/CartProvider";
import { cn } from "@/lib/utils";

/**
 * Product sheet — a fixed-height dialog on desktop, a bottom sheet on phones.
 *
 * The frame is always the same size regardless of how much a product carries,
 * so opening one dish never resizes the page around it. Inside, the header and
 * the action bar stay put while the detail column scrolls, and a long extras
 * list scrolls within its own bounded area so the note field and the price
 * never get pushed out of reach.
 */
export const ProductModal = ({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) => {
  const { t, tr, formatPrice } = useI18n();
  const { getExtras } = useStore();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");

  // Reset whenever a different product is opened
  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setSelected([]);
    setNote("");
  }, [product]);

  // Escape closes, and the page behind stays put
  useEffect(() => {
    if (!product) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [product, onClose]);

  const extras = useMemo(() => (product ? getExtras(product.extraIds) : []), [product, getExtras]);

  const selectedExtras: SelectedExtra[] = useMemo(
    () =>
      extras
        .filter((extra) => selected.includes(extra.id))
        .map(({ id, name, price }) => ({ id, name, price })),
    [extras, selected]
  );

  const total = product
    ? (product.price + selectedExtras.reduce((sum, extra) => sum + extra.price, 0)) * quantity
    : 0;

  const toggleExtra = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const handleAdd = () => {
    if (!product || !product.available) return;
    addItem(product, { quantity, extras: selectedExtras, note });
    toast.success(t("product.added", { name: tr(product.name) }));
    onClose();
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="product-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={tr(product.name)}
        >
          <button
            type="button"
            aria-label={t("product.close")}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
          />

          {/* one fixed frame for every product */}
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex h-[88svh] w-full max-w-4xl flex-col overflow-hidden rounded-t-4xl border border-border/70 bg-background shadow-lift sm:h-[min(88vh,40rem)] sm:rounded-4xl md:flex-row"
          >
            {/* ------------------------------------------------- media */}
            <div className="relative hidden shrink-0 md:block md:w-[38%]">
              <div className={cn("h-full w-full", !product.available && "grayscale")}>
                <ProductImage
                  src={product.image}
                  name={product.name}
                  seed={product.id}
                  loading="eager"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />

              {product.tags.length > 0 && (
                <div className="absolute left-5 top-5 flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-ink-950/70 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-cream-100 backdrop-blur-md"
                    >
                      {t(`menu.${tag}` as "menu.popular")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* --------------------------------------------- content */}
            <div className="flex min-h-0 flex-1 flex-col">
              {/* grab handle on mobile */}
              <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border md:hidden" />

              {/* header stays put */}
              <header className="relative shrink-0 border-b border-border/60 px-5 pb-4 pt-4 sm:px-7 sm:pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t("product.close")}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground sm:right-5 sm:top-5"
                >
                  <X className="h-4 w-4" />
                </button>

                <h2 className="max-w-[85%] font-display text-xl font-extrabold leading-tight sm:text-2xl">
                  {tr(product.name)}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {tr(product.description)}
                </p>
                <p className="mt-2.5 font-display text-lg font-bold text-basil-300">
                  {formatPrice(product.price)}
                </p>
              </header>

              {/* only this column scrolls */}
              <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
                {/* mobile image strip */}
                <div className="mb-5 h-36 overflow-hidden rounded-2xl md:hidden">
                  <div className={cn("h-full w-full", !product.available && "grayscale")}>
                    <ProductImage src={product.image} name={product.name} seed={product.id} loading="eager" />
                  </div>
                </div>

                {!product.available && (
                  <div className="notice-amber mb-5 flex items-start gap-3 p-4 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t("product.unavailableHint")}</span>
                  </div>
                )}

                {/* extras — bounded, with its own scroll when the list is long */}
                {product.available && extras.length > 0 && (
                  <section>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                        {t("product.extras")}
                      </h3>
                      <span className="text-xs text-muted-foreground">{t("product.extras.hint")}</span>
                    </div>

                    <div className="relative mt-3">
                      <ul
                        className={cn(
                          "grid gap-2 sm:grid-cols-2",
                          extras.length > 6 && "scroll-slim max-h-[15.5rem] overflow-y-auto pr-1.5"
                        )}
                      >
                        {extras.map((extra) => {
                          const isSelected = selected.includes(extra.id);
                          return (
                            <li key={extra.id}>
                              <button
                                type="button"
                                onClick={() => toggleExtra(extra.id)}
                                aria-pressed={isSelected}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all duration-200",
                                  isSelected
                                    ? "border-primary bg-primary/[0.08]"
                                    : "border-border bg-card hover:border-foreground/25"
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                    isSelected
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input"
                                  )}
                                >
                                  {isSelected && <Check className="h-3.5 w-3.5" />}
                                </span>
                                <span className="flex-1 text-sm font-medium leading-tight">
                                  {tr(extra.name)}
                                </span>
                                <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                                  {extra.price > 0 ? `+${formatPrice(extra.price)}` : "—"}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>

                      {/* hints that the list continues */}
                      {extras.length > 6 && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
                      )}
                    </div>
                  </section>
                )}

                {/* note */}
                {product.available && (
                  <section className="mt-6">
                    <label
                      htmlFor="product-note"
                      className="font-display text-sm font-bold uppercase tracking-wider"
                    >
                      {t("product.notes")}
                    </label>
                    <textarea
                      id="product-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={3}
                      maxLength={280}
                      placeholder={t("product.notes.placeholder")}
                      className="field mt-2.5 resize-none"
                    />
                  </section>
                )}

                {product.allergens && (
                  <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold">{t("product.allergens")}: </span>
                    {tr(product.allergens)}
                  </p>
                )}
              </div>

              {/* action bar stays put */}
              {product.available && (
                <div className="shrink-0 border-t border-border/60 bg-card/60 px-5 py-4 backdrop-blur sm:px-7">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-full bg-muted p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                        aria-label="−"
                        disabled={quantity <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm transition-transform active:scale-90 disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] text-center font-display text-base font-bold tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                        aria-label="+"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm transition-transform active:scale-90"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <Button size="lg" className="flex-1 justify-between" onClick={handleAdd}>
                      <span>{t("product.addToCart")}</span>
                      <motion.span
                        key={total}
                        initial={{ opacity: 0.5, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18 }}
                        className="tabular-nums"
                      >
                        {formatPrice(total)}
                      </motion.span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
