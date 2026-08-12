import { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminField, PageHeader, Panel, Toggle } from "@/components/admin/AdminUI";
import { OpenStatusBadge } from "@/components/shared/OpenStatusBadge";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { DayHours, RestaurantSettings } from "@/types";
import { createId } from "@/services/storage";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

// Monday first, Sunday last
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const AdminHours = () => {
  const { settings, saveSettings } = useStore();
  const { t } = useI18n();
  const [draft, setDraft] = useState<RestaurantSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const updateDay = (weekday: number, patch: Partial<DayHours>) =>
    setDraft((current) => ({
      ...current,
      hours: current.hours.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)),
    }));

  const addClosure = () =>
    setDraft((current) => ({
      ...current,
      closures: [
        ...current.closures,
        { id: createId("closure"), date: new Date().toISOString().slice(0, 10), reason: "" },
      ],
    }));

  const handleSave = () => {
    saveSettings(draft);
    toast.success(t("common.saved"));
  };

  return (
    <>
      <PageHeader
        title={t("admin.hours.title")}
        subtitle={t("admin.hours.subtitle")}
        actions={
          <>
            <OpenStatusBadge />
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* weekly schedule */}
        <Panel title={t("contact.orderHours")}>
          <ul className="space-y-2">
            {WEEK_ORDER.map((weekday) => {
              const day = draft.hours.find((entry) => entry.weekday === weekday);
              if (!day) return null;

              return (
                <li
                  key={weekday}
                  className={cn(
                    "flex flex-wrap items-center gap-3 rounded-2xl border p-4 transition-colors",
                    day.open ? "border-border/70" : "border-dashed border-border bg-muted/40"
                  )}
                >
                  <span className="w-28 shrink-0 text-sm font-bold">
                    {t(`day.${weekday}` as TranslationKey)}
                  </span>

                  <Toggle
                    checked={day.open}
                    onChange={(value) => updateDay(weekday, { open: value })}
                    label={t("admin.hours.open")}
                  />

                  {day.open ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="time"
                        aria-label={t("admin.hours.from")}
                        className="field h-11 w-32"
                        value={day.from}
                        onChange={(event) => updateDay(weekday, { from: event.target.value })}
                      />
                      <span className="text-muted-foreground">–</span>
                      <input
                        type="time"
                        aria-label={t("admin.hours.to")}
                        className="field h-11 w-32"
                        value={day.to}
                        onChange={(event) => updateDay(weekday, { to: event.target.value })}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("status.closed")}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-4">
          {/* temporary closure */}
          <Panel title={t("admin.hours.tempClosed")}>
            <div
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4",
                draft.temporarilyClosed ? "border-destructive/30 bg-destructive/[0.05]" : "border-border/70"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    draft.temporarilyClosed ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                  {t("admin.hours.tempClosedHint")}
                </p>
              </div>
              <Toggle
                checked={draft.temporarilyClosed}
                onChange={(value) => setDraft({ ...draft, temporarilyClosed: value })}
                label={t("admin.hours.tempClosed")}
              />
            </div>
          </Panel>

          {/* special closures */}
          <Panel
            title={t("admin.hours.closures")}
            actions={
              <Button size="sm" variant="outline" onClick={addClosure}>
                <Plus />
                {t("admin.hours.addClosure")}
              </Button>
            }
          >
            {draft.closures.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("admin.sales.empty")}</p>
            ) : (
              <ul className="space-y-3">
                {draft.closures.map((closure) => (
                  <li key={closure.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
                      <AdminField label={t("admin.hours.closureDate")}>
                        <input
                          type="date"
                          className="field"
                          value={closure.date}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              closures: draft.closures.map((entry) =>
                                entry.id === closure.id ? { ...entry, date: event.target.value } : entry
                              ),
                            })
                          }
                        />
                      </AdminField>

                      <AdminField label={t("admin.hours.closureReason")}>
                        <input
                          className="field"
                          value={closure.reason}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              closures: draft.closures.map((entry) =>
                                entry.id === closure.id ? { ...entry, reason: event.target.value } : entry
                              ),
                            })
                          }
                        />
                      </AdminField>

                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            closures: draft.closures.filter((entry) => entry.id !== closure.id),
                          })
                        }
                        aria-label={t("common.delete")}
                        className="mb-1 rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminHours;
