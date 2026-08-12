import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminField, EmptyState, PageHeader, Panel } from "@/components/admin/AdminUI";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { Category } from "@/types";
import { createId } from "@/services/storage";

const emptyCategory = (sortOrder: number): Category => ({
  id: "",
  name: { de: "", en: "" },
  tagline: { de: "", en: "" },
  sortOrder,
});

const AdminCategories = () => {
  const { categories, products, saveCategory, deleteCategory, moveCategory } = useStore();
  const { t, tr } = useI18n();
  const [editing, setEditing] = useState<Category | null>(null);

  const countFor = (categoryId: string) =>
    products.filter((product) => product.categoryId === categoryId).length;

  const handleDelete = (category: Category) => {
    if (!window.confirm(t("admin.categories.deleteConfirm"))) return;
    deleteCategory(category.id);
    toast.success(t("admin.menu.deleted"));
  };

  return (
    <>
      <PageHeader
        title={t("admin.categories.title")}
        subtitle={t("admin.categories.subtitle")}
        actions={
          <Button onClick={() => setEditing(emptyCategory(categories.length + 1))}>
            <Plus />
            {t("admin.categories.new")}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <Panel>
          {categories.length === 0 ? (
            <EmptyState title={t("menu.empty.title")} icon={Tags} />
          ) : (
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <li
                  key={category.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 p-4 transition-colors hover:border-primary/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-extrabold text-basil-300">
                    {index + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{tr(category.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">{tr(category.tagline)}</p>
                  </div>

                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[0.7rem] font-bold text-muted-foreground">
                    {t("admin.categories.products", { count: countFor(category.id) })}
                  </span>

                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      onClick={() => moveCategory(category.id, -1)}
                      disabled={index === 0}
                      aria-label={t("admin.menu.moveUp")}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(category.id, 1)}
                      disabled={index === categories.length - 1}
                      aria-label={t("admin.menu.moveDown")}
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditing(category)}
                    aria-label={t("common.edit")}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    aria-label={t("common.delete")}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {editing && (
          <Panel title={editing.id ? t("common.edit") : t("admin.categories.new")}>
            <div className="space-y-4">
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
                <input
                  className="field"
                  value={editing.tagline.de}
                  onChange={(event) =>
                    setEditing({ ...editing, tagline: { ...editing.tagline, de: event.target.value } })
                  }
                />
              </AdminField>

              <AdminField label={t("admin.menu.descEn")}>
                <input
                  className="field"
                  value={editing.tagline.en}
                  onChange={(event) =>
                    setEditing({ ...editing, tagline: { ...editing.tagline, en: event.target.value } })
                  }
                />
              </AdminField>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>
                  {t("common.cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    if (!editing.name.de.trim()) {
                      toast.error(t("checkout.error.required"));
                      return;
                    }
                    saveCategory({ ...editing, id: editing.id || createId("cat") });
                    setEditing(null);
                    toast.success(t("common.saved"));
                  }}
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </>
  );
};

export default AdminCategories;
