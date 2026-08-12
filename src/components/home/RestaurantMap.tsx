import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * Live Google map of the restaurant.
 *
 * Uses the keyless `output=embed` endpoint, so there is nothing to configure
 * and no billing account involved. The tiles ship light, so a filter inverts
 * them into the dark palette — `hue-rotate(180deg)` after the invert brings
 * marker and road colours back to roughly their original hues.
 *
 * Address and coordinates come from the admin settings, so moving the
 * restaurant moves the map.
 */
export const RestaurantMap = () => {
  const { settings } = useStore();
  const { t, language } = useI18n();

  const { street, zip, city, lat, lng } = settings.address;
  const fullAddress = `${street}, ${zip} ${city}`;
  const query = encodeURIComponent(fullAddress);

  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}(${query})&z=16&hl=${language}&output=embed`;
  const placeUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  return (
    <div className="group relative h-64 overflow-hidden rounded-3xl border border-border/70 bg-ink-950 shadow-soft sm:h-72">
      <iframe
        title={`${settings.name} — ${fullAddress}`}
        src={embedUrl}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 h-full w-full border-0 opacity-90 [filter:invert(0.92)_hue-rotate(180deg)_brightness(0.95)_contrast(0.9)] transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* warm tint + vignette so the map belongs to the palette */}
      <div className="pointer-events-none absolute inset-0 bg-ember-800/12 mix-blend-multiply" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 to-transparent" />

      {/* address + actions */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
            <MapPin className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-display text-base font-bold leading-tight text-cream-50">
              {street}
            </span>
            <span className="block text-sm text-cream-100/60">
              {zip} {city}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={placeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-950/70 px-3.5 py-2 text-xs font-semibold text-cream-100/70 backdrop-blur-xl transition-colors hover:border-white/25 hover:text-cream-50"
          >
            {t("contact.largerMap")}
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-soft transition-colors hover:bg-ember-600"
          >
            <Navigation className="h-3 w-3" />
            {t("contact.directions")}
          </a>
        </div>
      </div>
    </div>
  );
};
