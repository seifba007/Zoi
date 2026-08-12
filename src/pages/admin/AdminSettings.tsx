import { useEffect, useState } from "react";
import { Wallet, CreditCard, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminField, PageHeader, Panel, Toggle } from "@/components/admin/AdminUI";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { PaymentMethod, RestaurantSettings } from "@/types";
import { resetStorage } from "@/services/storage";
import { TranslationKey } from "@/i18n/translations";

const PAYMENT_ROWS: { method: PaymentMethod; icon: typeof Wallet; label: TranslationKey }[] = [
  { method: "cash", icon: Wallet, label: "checkout.payment.cash" },
  { method: "paypal", icon: ShieldCheck, label: "checkout.payment.paypal" },
  { method: "card", icon: CreditCard, label: "checkout.payment.card" },
];

const AdminSettings = () => {
  const { settings, saveSettings } = useStore();
  const { t } = useI18n();
  const [draft, setDraft] = useState<RestaurantSettings>(settings);

  useEffect(() => setDraft(settings), [settings]);

  const handleSave = () => {
    saveSettings(draft);
    toast.success(t("common.saved"));
  };

  const handleReset = () => {
    if (!window.confirm("Alle lokalen Daten (Menü, Bestellungen, Einstellungen) zurücksetzen?")) return;
    resetStorage();
    window.location.reload();
  };

  return (
    <>
      <PageHeader
        title={t("admin.settings.title")}
        subtitle={t("admin.settings.subtitle")}
        actions={<Button onClick={handleSave}>{t("common.save")}</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {/* base data */}
        <Panel title={t("admin.settings.title")}>
          <div className="space-y-4">
            <AdminField label={t("admin.settings.restaurantName")}>
              <input
                className="field"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </AdminField>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={t("admin.settings.phone")}>
                <input
                  className="field"
                  value={draft.phone}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                />
              </AdminField>

              <AdminField label={t("admin.settings.email")}>
                <input
                  type="email"
                  className="field"
                  value={draft.email}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                />
              </AdminField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={t("admin.settings.prepTime")}>
                <input
                  type="number"
                  min="5"
                  step="5"
                  className="field"
                  value={draft.prepTimeMinutes}
                  onChange={(event) => setDraft({ ...draft, prepTimeMinutes: Number(event.target.value) })}
                />
              </AdminField>

              <AdminField label={t("admin.settings.deliveryTime")}>
                <input
                  type="number"
                  min="5"
                  step="5"
                  className="field"
                  value={draft.deliveryTimeMinutes}
                  onChange={(event) => setDraft({ ...draft, deliveryTimeMinutes: Number(event.target.value) })}
                />
              </AdminField>
            </div>
          </div>
        </Panel>

        {/* payments */}
        <div className="space-y-4">
          <Panel title={t("admin.settings.payments")} description={t("admin.settings.paymentsHint")}>
            <ul className="space-y-3">
              {PAYMENT_ROWS.map(({ method, icon: Icon, label }) => (
                <li
                  key={method}
                  className="flex items-center justify-between rounded-2xl border border-border/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-bold">{t(label)}</p>
                  </div>
                  <Toggle
                    checked={draft.payments[method]}
                    onChange={(value) =>
                      setDraft({ ...draft, payments: { ...draft.payments, [method]: value } })
                    }
                    label={t(label)}
                  />
                </li>
              ))}
            </ul>

            {/* spec says "cash on pickup" — this decides whether delivery gets it too */}
            {draft.payments.cash && (
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-dashed border-border p-4">
                <div>
                  <p className="text-sm font-bold">{t("admin.settings.cashOnDelivery")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("admin.settings.cashOnDeliveryHint")}
                  </p>
                </div>
                <Toggle
                  checked={draft.cashOnDelivery}
                  onChange={(value) => setDraft({ ...draft, cashOnDelivery: value })}
                  label={t("admin.settings.cashOnDelivery")}
                />
              </div>
            )}

            <div className="mt-5">
              <AdminField label={t("admin.settings.provider")} hint={t("admin.settings.providerHint")}>
                <select
                  className="field"
                  value={draft.paymentProvider}
                  onChange={(event) =>
                    setDraft({ ...draft, paymentProvider: event.target.value as RestaurantSettings["paymentProvider"] })
                  }
                >
                  <option value="demo">Demo</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                </select>
              </AdminField>
            </div>
          </Panel>

          <Panel title="Reset">
            <div className="flex items-center justify-between gap-4">
              <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                Setzt Menü, Bestellungen und Einstellungen auf die Demo-Daten zurück. Nützlich beim Testen.
              </p>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw />
                Reset
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
