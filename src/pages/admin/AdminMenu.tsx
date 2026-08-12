import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Image as ImageIcon, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminField, EmptyState, PageHeader, Panel, Toggle } from "@/components/admin/AdminUI";
import { ProductImage } from "@/components/shared/ProductImage";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { Extra, Product, ProductTag } from "@/types";
import { createId } from "@/services/storage";
import { cn } from "@/lib/utils";

const TAGS: ProductTag[] = ["popular", "spicy", "vegetarian", "new"];

const emptyProduct = (categoryId: string, sortOrder: number): Product => ({
  id: "",
  categoryId,
  name: { de: "", en: "" },
  description: { de: "", en: "" },
  price: 0,
  image: "",
  available: true,
  tags: [],
  extraIds: [],
  sortOrder,
});

const AdminMenu = () => {
  const {
    categories, products, extras, saveProduct, deleteProduct,
    toggleProductAvailability, moveProduct, saveExtra, deleteExtra, productsByCategory,
  } = useStore();
  const { t, tr, formatPrice } = useI18n();

  const [editing, setEditing] = useState<Product | null>(null);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(
    () => (activeCategory ? productsByCategory(activeCategory) : products),
    [activeCategory, productsByCategory, products]
  );

  const handleSave = () => {
    if (!editing) return;
    if (!editing.name.de.trim()) {
      toast.error(t("checkout.error.required"));
      return;
    }
    saveProduct({ ...editing, id: editing.id || createId("p") });
    setEditing(null);
    toast.success(t("admin.menu.saved"));
  };

  const handleDelete = (product: Product) => {
    if (!window.confirm(t("admin.menu.deleteConfirm"))) return;
    deleteProduct(product.id);
    toast.success(t("admin.menu.deleted"));
  };

  /** Reads an uploaded image as a data URL — a real backend would upload to storage. */
  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setEditing((current) => (current ? { ...current, image: String(reader.result) } : current));
    reader.readAsDataURL(file);
  };

  return (
    <>
      <PageHeader
        title={t("admin.menu.title")}
        subtitle={t("admin.menu.subtitle")}
        actions={
          <Button
            onClick={() =>
              setEditing(emptyProduct(activeCategory || categories[0]?.id || "", list.length + 1))
            }
          >
            <Plus />
            {t("admin.menu.new")}
          </Button>
        }
      />

      {/* category rail */}
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeCategory === category.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeCategory === category.id && (
              <motion.span
                layoutId="admin-category-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {tr(category.name)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        {/* products */}
        <Panel>
          {list.length === 0 ? (
            <EmptyState title={t("menu.empty.title")} icon={UtensilsCrossed} />
          ) : (
            <ul className="space-y-3">
              {list.map((product, index) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 p-3 transition-colors hover:border-primary/30"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                    <ProductImage src={product.image} name={product.name} seed={product.id} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{tr(product.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">{tr(product.description)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-basil-300">{formatPrice(product.price)}</span>
                      {product.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[0.6rem] font-bold uppercase text-muted-foreground">
                          {t(`menu.${tag}` as "menu.popular")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveProduct(product.id, -1)}
                      disabled={index === 0}
                      aria-label={t("admin.menu.moveUp")}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(product.id, 1)}
                      disabled={index === list.length - 1}
                      aria-label={t("admin.menu.moveDown")}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Toggle
                      checked={product.available}
                      onChange={(value) => toggleProductAvailability(product.id, value)}
                      label={t("admin.menu.available")}
                    />
                    <button
                      type="button"
                      onClick={() => setEditing(product)}
                      aria-label={t("common.edit")}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      aria-label={t("common.delete")}
                      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* extras */}
        <Panel
          title={t("admin.extras.title")}
          actions={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingExtra({ id: "", name: { de: "", en: "" }, price: 0 })}
            >
              <Plus />
              {t("admin.extras.new")}
            </Button>
          }
        >
          <ul className="space-y-2">
            {extras.map((extra) => (
              <li
                key={extra.id}
                className="flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5"
              >
                <span className="flex-1 text-sm font-medium">{tr(extra.name)}</span>
                <span className="text-sm font-bold tabular-nums text-muted-foreground">
                  {extra.price > 0 ? `+${formatPrice(extra.price)}` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingExtra(extra)}
                  aria-label={t("common.edit")}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteExtra(extra.id)}
                  aria-label={t("common.delete")}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* ---------------------------------------------------- product editor */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex justify-end"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setEditing(null)}
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-background shadow-lift"
            >
              <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/70 bg-background/95 px-6 py-5 backdrop-blur">
                <h2 className="font-display text-lg font-bold">
                  {editing.id ? t("admin.menu.edit") : t("admin.menu.new")}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  aria-label={t("common.close")}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/[0.06]"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="space-y-5 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label={t("admin.menu.nameDe")}>
                    <input
                      className="field"
                      value={editing.name.de}
                      onChange={(event) =>
                        setEditing({ ...editing, name: { ...editing.name, de: event.target.value } })
                      }
                    />
                  </AdminField>
                  <AdminField label={t("admin.menu.nameEn")}>
                    <input
                      className="field"
                      value={editing.name.en}
                      onChange={(event) =>
                        setEditing({ ...editing, name: { ...editing.name, en: event.target.value } })
                      }
                    />
                  </AdminField>
                </div>

                <AdminField label={t("admin.menu.descDe")}>
                  <textarea
                    rows={2}
                    className="field resize-none"
                    value={editing.description.de}
                    onChange={(event) =>
                      setEditing({ ...editing, description: { ...editing.description, de: event.target.value } })
                    }
                  />
                </AdminField>

                <AdminField label={t("admin.menu.descEn")}>
                  <textarea
                    rows={2}
                    className="field resize-none"
                    value={editing.description.en}
                    onChange={(event) =>
                      setEditing({ ...editing, description: { ...editing.description, en: event.target.value } })
                    }
                  />
                </AdminField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label={t("admin.menu.price")}>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      className="field"
                      value={editing.price}
                      onChange={(event) => setEditing({ ...editing, price: Number(event.target.value) })}
                    />
                  </AdminField>

                  <AdminField label={t("admin.menu.category")}>
                    <select
                      className="field"
                      value={editing.categoryId}
                      onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {tr(category.name)}
                        </option>
                      ))}
                    </select>
                  </AdminField>
                </div>

                <AdminField label={t("admin.menu.image")} hint={t("admin.menu.imageHint")}>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <ProductImage src={editing.image} name={editing.name} seed={editing.id || "new"} />
                    </div>
                    <input
                      className="field flex-1"
                      value={editing.image?.startsWith("data:") ? "" : editing.image ?? ""}
                      placeholder="/shawarma.webp"
                      onChange={(event) => setEditing({ ...editing, image: event.target.value })}
                    />
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()}>
                      <ImageIcon />
                    </Button>
                  </div>
                </AdminField>

                <AdminField label={t("admin.menu.tags")}>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((tag) => {
                      const active = editing.tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              tags: active
                                ? editing.tags.filter((entry) => entry !== tag)
                                : [...editing.tags, tag],
                            })
                          }
                          className={cn(
                            "rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {t(`menu.${tag}` as "menu.popular")}
                        </button>
                      );
                    })}
                  </div>
                </AdminField>

                <AdminField label={t("admin.menu.extras")}>
                  <div className="flex flex-wrap gap-2">
                    {extras.map((extra) => {
                      const active = editing.extraIds.includes(extra.id);
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              extraIds: active
                                ? editing.extraIds.filter((entry) => entry !== extra.id)
                                : [...editing.extraIds, extra.id],
                            })
                          }
                          className={cn(
                            "rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                            active ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {tr(extra.name)}
                        </button>
                      );
                    })}
                  </div>
                </AdminField>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                  <div>
                    <p className="text-sm font-bold">{t("admin.menu.available")}</p>
                    <p className="text-xs text-muted-foreground">{t("product.unavailableHint")}</p>
                  </div>
                  <Toggle
                    checked={editing.available}
                    onChange={(value) => setEditing({ ...editing, available: value })}
                    label={t("admin.menu.available")}
                  />
                </div>
              </div>

              <footer className="sticky bottom-0 flex gap-3 border-t border-border/70 bg-background/95 px-6 py-4 backdrop-blur">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>
                  {t("common.cancel")}
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  {t("common.save")}
                </Button>
              </footer>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------ extra editor */}
      <AnimatePresence>
        {editingExtra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[75] flex items-center justify-center p-5"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={() => setEditingExtra(null)}
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-background p-6 shadow-lift"
            >
              <h2 className="font-display text-lg font-bold">{t("admin.extras.title")}</h2>

              <div className="mt-5 space-y-4">
                <AdminField label={t("admin.menu.nameDe")}>
                  <input
                    className="field"
                    value={editingExtra.name.de}
                    onChange={(event) =>
                      setEditingExtra({ ...editingExtra, name: { ...editingExtra.name, de: event.target.value } })
                    }
                  />
                </AdminField>
                <AdminField label={t("admin.menu.nameEn")}>
                  <input
                    className="field"
                    value={editingExtra.name.en}
                    onChange={(event) =>
                      setEditingExtra({ ...editingExtra, name: { ...editingExtra.name, en: event.target.value } })
                    }
                  />
                </AdminField>
                <AdminField label={t("admin.menu.price")}>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    className="field"
                    value={editingExtra.price}
                    onChange={(event) => setEditingExtra({ ...editingExtra, price: Number(event.target.value) })}
                  />
                </AdminField>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEditingExtra(null)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    saveExtra({ ...editingExtra, id: editingExtra.id || createId("ex") });
                    setEditingExtra(null);
                    toast.success(t("admin.extras.saved"));
                  }}
                >
                  {t("common.save")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminMenu;
