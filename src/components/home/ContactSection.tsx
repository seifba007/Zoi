import { MapPin, Phone, Mail, Clock, Bike, ShoppingBag } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { RestaurantMap } from "./RestaurantMap";
import { OpenStatusBadge } from "@/components/shared/OpenStatusBadge";
import { useI18n } from "@/i18n/LanguageProvider";
import { useStore } from "@/context/StoreProvider";
import { useOpeningStatus } from "@/hooks/useOpeningStatus";
import { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

/** Contact details, live ordering window and the full weekly schedule. */
export const ContactSection = () => {
  const { t, tr } = useI18n();
  const { settings } = useStore();
  const { isOpen, label } = useOpeningStatus();
  const today = new Date().getDay();

  const details = [
    {
      icon: MapPin,
      title: t("contact.address"),
      lines: [settings.address.street, `${settings.address.zip} ${settings.address.city}`],
    },
    {
      icon: Phone,
      title: t("contact.phone"),
      lines: [settings.phone],
      href: `tel:${settings.phone.replace(/\s/g, "")}`,
    },
    {
      icon: Mail,
      title: t("contact.email"),
      lines: [settings.email],
      href: `mailto:${settings.email}`,
    },
  ];

  return (
    <section id="contact" className="section-padding bg-muted/40">
      <div className="container-width">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <span className="h-px w-8 bg-basil-400" />
            {t("contact.eyebrow")}
            <span className="h-px w-8 bg-basil-400" />
          </span>
          <h2 className="display-xl mt-4 text-[clamp(2rem,5vw,3.25rem)]">{t("contact.title")}</h2>
          <p className="mt-4 text-muted-foreground">{t("contact.subtitle")}</p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* details */}
          <Reveal className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {details.map(({ icon: Icon, title, lines, href }) => (
                <div
                  key={title}
                  className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-basil-400/10 text-basil-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {title}
                  </h3>
                  <div className="mt-1.5 text-sm font-medium leading-relaxed">
                    {href ? (
                      <a href={href} className="transition-colors hover:text-basil-300">
                        {lines[0]}
                      </a>
                    ) : (
                      lines.map((line) => <p key={line}>{line}</p>)
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* order options */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft">
                <span className="flex items-center gap-2 font-display text-base font-bold">
                  <ShoppingBag className="h-4 w-4 text-basil-300" />
                  {t("status.pickup")}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("status.pickupTime", { minutes: settings.prepTimeMinutes })}
                </p>
              </div>

              <div
                className={cn(
                  "rounded-3xl border border-border/70 bg-card p-6 shadow-soft",
                  !settings.delivery.enabled && "opacity-60"
                )}
              >
                <span className="flex items-center gap-2 font-display text-base font-bold">
                  <Bike className="h-4 w-4 text-basil-300" />
                  {t("status.delivery")}
                </span>
                <p className="mt-2 text-sm text-muted-foreground">
                  {settings.delivery.enabled
                    ? `${t("status.deliveryTime", { minutes: settings.deliveryTimeMinutes })} · ${t(
                        "cart.minOrder",
                        { amount: `${settings.delivery.minOrderValue.toFixed(2)} €` }
                      )}`
                    : t("status.closed")}
                </p>
              </div>
            </div>

            <RestaurantMap />
          </Reveal>

          {/* hours */}
          <Reveal delay={0.1}>
            <div className="rounded-4xl border border-border/70 bg-card p-7 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-basil-400/10 text-basil-300">
                    <Clock className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold">{t("contact.orderHours")}</h3>
                </div>
                <OpenStatusBadge />
              </div>

              <ul className="mt-6 divide-y divide-border/70">
                {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                  const day = settings.hours.find((entry) => entry.weekday === weekday);
                  const isToday = weekday === today;
                  return (
                    <li
                      key={weekday}
                      className={cn(
                        "flex items-center justify-between py-3 text-sm",
                        isToday && "font-bold text-basil-300"
                      )}
                    >
                      <span>{t(`day.${weekday}` as TranslationKey)}</span>
                      <span className="tabular-nums">
                        {day?.open ? `${day.from} – ${day.to}` : t("status.closed")}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {!isOpen && (
                <div className="notice-amber mt-6 p-4">
                  <p className="text-sm font-semibold">{t("status.orderingClosed")}</p>
                  <p className="mt-1 text-xs text-ember-200/75">{label}</p>
                  <p className="mt-2 text-xs text-ember-200/60">{t("status.orderingClosedHint")}</p>
                </div>
              )}

              {settings.closures.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
                  {settings.closures.map((closure) => (
                    <li key={closure.id} className="flex justify-between gap-3">
                      <span className="tabular-nums">{closure.date}</span>
                      <span>{tr(closure.reason)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
