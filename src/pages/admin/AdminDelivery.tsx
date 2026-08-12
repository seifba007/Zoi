import { useEffect, useState } from "react";
import { Plus, Trash2, MapPin, Bike } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminField, PageHeader, Panel, Toggle } from "@/components/admin/AdminUI";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { DeliveryZone, RestaurantSettings } from "@/types";
import { createId } from "@/services/storage";

/**
 * Delivery configuration. Nothing here is hard-coded in the ordering flow —
 * the checkout reads exactly these zones, fees and limits.
 */
const AdminDelivery = () => {
  const { settings, saveSettings } = useStore();
  const { t, formatPrice } = useI18n();
  const [draft, setDraft] = useState<RestaurantSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const updateDelivery = (patch: Partial<RestaurantSettings["delivery"]>) =>
    setDraft((current) => ({ ...current, delivery: { ...current.delivery, ...patch } }));

  const updateZone = (id: string, patch: Partial<DeliveryZone>) =>
    updateDelivery({
      zones: draft.delivery.zones.map((zone) => (zone.id === id ? { ...zone, ...patch } : zone)),
    });

  const addZone = () => {
    const last = [...draft.delivery.zones].sort((a, b) => a.toKm - b.toKm).at(-1);
    const fromKm = last?.toKm ?? 0;
    updateDelivery({
      zones: [
        ...draft.delivery.zones,
        {
          id: createId("zone"),
          label: `${fromKm}–${fromKm + 2} km`,
          fromKm,
          toKm: fromKm + 2,
          fee: (last?.fee ?? 2) + 2,
        },
      ],
    });
  };

  const removeZone = (id: string) =>
    updateDelivery({ zones: draft.delivery.zones.filter((zone) => zone.id !== id) });

  const handleSave = () => {
    saveSettings(draft);
    toast.success(t("common.saved"));
  };

  return (
    <>
      <PageHeader
        title={t("admin.delivery.title")}
        subtitle={t("admin.delivery.subtitle")}
        actions={<Button onClick={handleSave}>{t("common.save")}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* zones */}
        <Panel
          title={t("admin.delivery.zones")}
          actions={
            <Button size="sm" variant="outline" onClick={addZone}>
              <Plus />
              {t("admin.delivery.addZone")}
            </Button>
          }
        >
          <ul className="space-y-3">
            {[...draft.delivery.zones]
              .sort((a, b) => a.fromKm - b.fromKm)
              .map((zone) => (
                <li key={zone.id} className="rounded-2xl border border-border/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-[1.4fr_repeat(3,0.8fr)_auto] sm:items-end">
                    <AdminField label={t("admin.delivery.zoneName")}>
                      <input
                        className="field"
                        value={zone.label}
                        onChange={(event) => updateZone(zone.id, { label: event.target.value })}
                      />
                    </AdminField>

                    <AdminField label={t("admin.delivery.fromKm")}>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="field"
                        value={zone.fromKm}
                        onChange={(event) => updateZone(zone.id, { fromKm: Number(event.target.value) })}
                      />
                    </AdminField>

                    <AdminField label={t("admin.delivery.toKm")}>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="field"
                        value={zone.toKm}
                        onChange={(event) => updateZone(zone.id, { toKm: Number(event.target.value) })}
                      />
                    </AdminField>

                    <AdminField label={t("admin.delivery.fee")}>
                      <input
                        type="number"
                        min="0"
                        step="0.50"
                        className="field"
                        value={zone.fee}
                        onChange={(event) => updateZone(zone.id, { fee: Number(event.target.value) })}
                      />
                    </AdminField>

                    <button
                      type="button"
                      onClick={() => removeZone(zone.id)}
                      aria-label={t("common.delete")}
                      className="mb-1 rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {zone.fromKm} – {zone.toKm} km · {formatPrice(zone.fee)}
                  </p>
                </li>
              ))}
          </ul>

          {draft.delivery.zones.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("admin.sales.empty")}
            </p>
          )}
        </Panel>

        {/* limits */}
        <div className="space-y-4">
          <Panel title={t("admin.delivery.title")}>
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-basil-400/10 text-basil-300">
                    <Bike className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-bold">{t("admin.delivery.enabled")}</p>
                </div>
                <Toggle
                  checked={draft.delivery.enabled}
                  onChange={(value) => updateDelivery({ enabled: value })}
                  label={t("admin.delivery.enabled")}
                />
              </div>

              <AdminField label={t("admin.delivery.minOrder")}>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  className="field"
                  value={draft.delivery.minOrderValue}
                  onChange={(event) => updateDelivery({ minOrderValue: Number(event.target.value) })}
                />
              </AdminField>

              <AdminField
                label={t("admin.delivery.freeThreshold")}
                hint={t("admin.delivery.freeThresholdHint")}
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="field"
                  value={draft.delivery.freeDeliveryThreshold ?? ""}
                  onChange={(event) =>
                    updateDelivery({
                      freeDeliveryThreshold: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
              </AdminField>

              <AdminField label={t("admin.delivery.maxDistance")}>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  className="field"
                  value={draft.delivery.maxDistanceKm}
                  onChange={(event) => updateDelivery({ maxDistanceKm: Number(event.target.value) })}
                />
              </AdminField>
            </div>
          </Panel>

          <Panel title={t("admin.delivery.restaurantAddress")}>
            <div className="space-y-4">
              <AdminField label={t("checkout.field.street")}>
                <input
                  className="field"
                  value={draft.address.street}
                  onChange={(event) =>
                    setDraft({ ...draft, address: { ...draft.address, street: event.target.value } })
                  }
                />
              </AdminField>

              <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                <AdminField label={t("checkout.field.zip")}>
                  <input
                    className="field"
                    value={draft.address.zip}
                    onChange={(event) =>
                      setDraft({ ...draft, address: { ...draft.address, zip: event.target.value } })
                    }
                  />
                </AdminField>

                <AdminField label={t("checkout.field.city")}>
                  <input
                    className="field"
                    value={draft.address.city}
                    onChange={(event) =>
                      setDraft({ ...draft, address: { ...draft.address, city: event.target.value } })
                    }
                  />
                </AdminField>
              </div>

              {/* drives the map on the contact page */}
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Latitude">
                  <input
                    type="number"
                    step="0.0001"
                    className="field"
                    value={draft.address.lat}
                    onChange={(event) =>
                      setDraft({ ...draft, address: { ...draft.address, lat: Number(event.target.value) } })
                    }
                  />
                </AdminField>

                <AdminField label="Longitude">
                  <input
                    type="number"
                    step="0.0001"
                    className="field"
                    value={draft.address.lng}
                    onChange={(event) =>
                      setDraft({ ...draft, address: { ...draft.address, lng: Number(event.target.value) } })
                    }
                  />
                </AdminField>
              </div>

              <p className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Die Koordinaten bestimmen die Karte auf der Kontaktseite. Distanzen werden aktuell anhand
                der PLZ geschätzt — für exakte Routen wird im Backend ein Geocoding-Dienst angebunden.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminDelivery;
