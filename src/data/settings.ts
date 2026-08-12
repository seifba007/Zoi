import { DayHours, RestaurantSettings } from "@/types";

/** Ordering is possible every day from 12:15 to 21:45. */
export const DEFAULT_OPEN = "12:15";
export const DEFAULT_CLOSE = "21:45";

const everyDay = (): DayHours[] =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    open: true,
    from: DEFAULT_OPEN,
    to: DEFAULT_CLOSE,
  }));

/**
 * Seed configuration. The admin dashboard persists changes on top of this,
 * so delivery prices and zones are never hard-coded in the UI.
 */
export const seedSettings: RestaurantSettings = {
  name: "Zoi",
  phone: "+49 30 5544 8899",
  email: "hallo@zoi.de",
  address: {
    street: "Sonnenallee 114",
    zip: "12045",
    city: "Berlin",
    lat: 52.4818,
    lng: 13.4406,
  },
  hours: everyDay(),
  closures: [],
  temporarilyClosed: false,
  delivery: {
    enabled: true,
    zones: [
      { id: "zone-1", label: "0–3 km", fromKm: 0, toKm: 3, fee: 3 },
      { id: "zone-2", label: "3–5 km", fromKm: 3, toKm: 5, fee: 5 },
      { id: "zone-3", label: "5–10 km", fromKm: 5, toKm: 10, fee: 8 },
    ],
    minOrderValue: 15,
    freeDeliveryThreshold: 45,
    maxDistanceKm: 10,
  },
  prepTimeMinutes: 25,
  deliveryTimeMinutes: 45,
  payments: {
    cash: true,
    paypal: true,
    card: true,
  },
  cashOnDelivery: true,
  paymentProvider: "demo",
};
