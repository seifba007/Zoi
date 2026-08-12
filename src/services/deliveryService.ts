import { CustomerDetails, DeliverySettings, DeliveryZone } from "@/types";

/**
 * Delivery pricing.
 *
 * `estimateDistanceKm` is the single seam where a real geocoder belongs
 * (Google Distance Matrix, Mapbox, OpenRouteService …). Everything downstream —
 * zones, fees, min order value — is driven by the admin settings, never hard-coded.
 */

export type DeliveryQuote =
  | {
      deliverable: true;
      distanceKm: number;
      zone: DeliveryZone;
      fee: number;
      /** Fee waived because the subtotal passed the free-delivery threshold. */
      free: boolean;
    }
  | {
      deliverable: false;
      distanceKm: number;
      reason: "outside" | "disabled";
    };

export type DeliveryAddress = Pick<CustomerDetails, "street" | "houseNumber" | "zip" | "city">;

/** Rough drive distances from the restaurant for the neighbourhoods we know. */
const KNOWN_ZIP_DISTANCES: Record<string, number> = {
  "12045": 0.6,
  "12047": 1.2,
  "12043": 1.8,
  "12049": 2.4,
  "12053": 3.1,
  "12055": 4.2,
  "12057": 5.6,
  "10967": 3.4,
  "10999": 4.1,
  "10965": 5.2,
  "12059": 6.4,
  "12099": 7.8,
  "10245": 6.1,
  "10243": 7.2,
  "10115": 9.4,
};

/** Stable pseudo-distance for unknown postcodes so quotes never flicker. */
const hashDistance = (address: DeliveryAddress): number => {
  const source = `${address.zip ?? ""}${address.street ?? ""}${address.houseNumber ?? ""}`.toLowerCase();
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 100000;
  }
  return Number((1 + (hash % 140) / 10).toFixed(1)); // 1.0 – 15.0 km
};

/**
 * Estimates the driving distance between the restaurant and a customer address.
 * Replace the body with a real geocoding call — the signature stays the same.
 */
export const estimateDistanceKm = async (address: DeliveryAddress): Promise<number> => {
  // Simulates the latency of a geocoding round-trip so the UI states are real.
  await new Promise((resolve) => setTimeout(resolve, 450));

  const zip = (address.zip ?? "").trim();
  if (KNOWN_ZIP_DISTANCES[zip] !== undefined) {
    // Nudge by house number so two addresses in one postcode differ slightly.
    const nudge = (Number(address.houseNumber) || 0) % 7 / 10;
    return Number((KNOWN_ZIP_DISTANCES[zip] + nudge).toFixed(1));
  }

  return hashDistance(address);
};

export const findZone = (distanceKm: number, settings: DeliverySettings): DeliveryZone | undefined =>
  [...settings.zones]
    .sort((a, b) => a.fromKm - b.fromKm)
    .find((zone) => distanceKm >= zone.fromKm && distanceKm <= zone.toKm);

/** Turns a distance into a concrete, fee-bearing quote. */
export const quoteDelivery = (
  distanceKm: number,
  subtotal: number,
  settings: DeliverySettings
): DeliveryQuote => {
  if (!settings.enabled) return { deliverable: false, distanceKm, reason: "disabled" };
  if (distanceKm > settings.maxDistanceKm) return { deliverable: false, distanceKm, reason: "outside" };

  const zone = findZone(distanceKm, settings);
  if (!zone) return { deliverable: false, distanceKm, reason: "outside" };

  const free =
    settings.freeDeliveryThreshold !== null && subtotal >= settings.freeDeliveryThreshold;

  return { deliverable: true, distanceKm, zone, fee: free ? 0 : zone.fee, free };
};

/** Convenience wrapper used by the checkout page. */
export const getDeliveryQuote = async (
  address: DeliveryAddress,
  subtotal: number,
  settings: DeliverySettings
): Promise<DeliveryQuote> => {
  const distanceKm = await estimateDistanceKm(address);
  return quoteDelivery(distanceKm, subtotal, settings);
};
