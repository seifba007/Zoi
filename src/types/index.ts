// Domain model for the Zoi ordering platform.
// Everything the UI renders flows through these types, so swapping the
// localStorage repository for a real API only means re-implementing the services.

export type Localized = { de: string; en: string };

export type ProductTag = "popular" | "spicy" | "vegetarian" | "new";

export interface Category {
  id: string;
  name: Localized;
  tagline: Localized;
  sortOrder: number;
}

export interface Extra {
  id: string;
  name: Localized;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: Localized;
  description: Localized;
  price: number;
  /** Path to an image in /public. Falls back to a branded placeholder when empty. */
  image?: string;
  available: boolean;
  tags: ProductTag[];
  extraIds: string[];
  allergens?: Localized;
  sortOrder: number;
}

/* ------------------------------------------------------------------ cart */

export interface SelectedExtra {
  id: string;
  name: Localized;
  price: number;
}

export interface CartItem {
  /** Unique per cart line — the same product with different extras is a new line. */
  lineId: string;
  productId: string;
  name: Localized;
  image?: string;
  unitPrice: number;
  quantity: number;
  extras: SelectedExtra[];
  note?: string;
}

/* ----------------------------------------------------------------- order */

export type OrderType = "pickup" | "delivery";
export type PaymentMethod = "cash" | "paypal" | "card";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "on_the_way"
  | "completed"
  | "delivered"
  | "cancelled";

export const PICKUP_FLOW: OrderStatus[] = ["new", "accepted", "preparing", "ready", "completed"];
export const DELIVERY_FLOW: OrderStatus[] = ["new", "accepted", "preparing", "on_the_way", "delivered"];

export interface CustomerDetails {
  name: string;
  phone: string;
  email?: string;
  street?: string;
  houseNumber?: string;
  zip?: string;
  city?: string;
  addressExtra?: string;
  comment?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  /** "demo" | "stripe" | "paypal" — whichever gateway handled the charge. */
  provider: string;
  reference?: string;
}

export interface Order {
  id: string;
  /** Human readable, e.g. ZO-1042 */
  number: string;
  createdAt: string;
  type: OrderType;
  status: OrderStatus;
  items: CartItem[];
  customer: CustomerDetails;
  payment: PaymentInfo;
  subtotal: number;
  deliveryFee: number;
  total: number;
  distanceKm?: number;
  zoneLabel?: string;
  /** Minutes promised to the customer at the time of ordering. */
  estimatedMinutes: number;
  estimatedReadyAt: string;
  statusHistory: { status: OrderStatus; at: string }[];
}

/* -------------------------------------------------------------- settings */

export interface DayHours {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  open: boolean;
  from: string; // "12:15"
  to: string;   // "21:45"
}

export interface SpecialClosure {
  id: string;
  date: string; // "YYYY-MM-DD"
  reason: string;
}

export interface DeliveryZone {
  id: string;
  label: string;
  fromKm: number;
  toKm: number;
  fee: number;
}

export interface DeliverySettings {
  enabled: boolean;
  zones: DeliveryZone[];
  minOrderValue: number;
  /** null disables the free-delivery threshold. */
  freeDeliveryThreshold: number | null;
  maxDistanceKm: number;
}

export interface RestaurantSettings {
  name: string;
  phone: string;
  email: string;
  /** Printed on invoices when set (USt-IdNr. / VAT ID). */
  taxId?: string;
  address: {
    street: string;
    zip: string;
    city: string;
    /** Used to centre the map on the contact page. */
    lat: number;
    lng: number;
  };
  hours: DayHours[];
  closures: SpecialClosure[];
  temporarilyClosed: boolean;
  delivery: DeliverySettings;
  prepTimeMinutes: number;
  deliveryTimeMinutes: number;
  payments: Record<PaymentMethod, boolean>;
  /** Cash is always offered for pickup; this decides whether delivery gets it too. */
  cashOnDelivery: boolean;
  /** "demo" until real Stripe/PayPal credentials are wired up in the backend. */
  paymentProvider: "demo" | "stripe" | "paypal";
}

/* --------------------------------------------------------------- opening */

export interface OpeningState {
  /** Ordering is possible right now. */
  isOpen: boolean;
  /** Closing time today, e.g. "21:45" — only when open. */
  closesAt?: string;
  /** Next opening moment when closed. */
  nextOpenAt?: Date;
  nextOpenLabel?: string;
  todayHours?: DayHours;
  reason?: "hours" | "closure" | "temporary";
}
