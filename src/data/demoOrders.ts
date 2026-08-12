import { CartItem, Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@/types";
import { seedExtras, seedProducts } from "./menu";

/**
 * Generates a realistic order history so the dashboard, charts and sales
 * reports look alive on first launch. Seeded, so numbers stay stable.
 */

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const FIRST_NAMES = ["Lena", "Jonas", "Amira", "Tobias", "Yusuf", "Marie", "Elias", "Sara", "Nils", "Fatima", "Paul", "Leila", "Jan", "Nour", "Hannah", "Omar"];
const LAST_NAMES = ["Weber", "Schmidt", "Haddad", "Bauer", "Khoury", "Fischer", "Nasser", "Krüger", "Aydın", "Wagner", "Saleh", "Hoffmann"];
const STREETS = ["Sonnenallee", "Weserstraße", "Karl-Marx-Straße", "Hermannstraße", "Pannierstraße", "Reuterstraße", "Boddinstraße"];
const COMMENTS = ["Bitte nicht klingeln.", "Bitte ohne Zwiebeln.", "2. Stock, links.", "Bitte extra scharf.", "", "", ""];

const pick = <T,>(rng: () => number, list: T[]): T => list[Math.floor(rng() * list.length)];

const buildItems = (rng: () => number): CartItem[] => {
  const available = seedProducts.filter((product) => product.available);
  const count = 1 + Math.floor(rng() * 3);
  const items: CartItem[] = [];

  for (let index = 0; index < count; index += 1) {
    const product = pick(rng, available);
    const extras = product.extraIds
      .filter(() => rng() > 0.78)
      .slice(0, 2)
      .map((extraId) => seedExtras.find((extra) => extra.id === extraId)!)
      .filter(Boolean)
      .map(({ id, name, price }) => ({ id, name, price }));

    items.push({
      lineId: `demo-${index}-${product.id}-${Math.floor(rng() * 100000)}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity: 1 + Math.floor(rng() * 2),
      extras,
      note: rng() > 0.85 ? pick(rng, COMMENTS) : undefined,
    });
  }

  return items;
};

export const lineTotal = (item: CartItem) =>
  (item.unitPrice + item.extras.reduce((sum, extra) => sum + extra.price, 0)) * item.quantity;

export const generateDemoOrders = (count = 64): Order[] => {
  const rng = mulberry32(20260812);
  const orders: Order[] = [];
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  for (let index = 0; index < count; index += 1) {
    // Spread orders over the last 30 days, clustered around service hours
    const daysAgo = Math.floor(rng() * 30);
    const hour = 12 + Math.floor(rng() * 10); // 12:00 – 21:00
    const minute = Math.floor(rng() * 60);

    const createdAt = new Date(now - daysAgo * day);
    createdAt.setHours(hour, minute, 0, 0);
    if (createdAt.getTime() > now) createdAt.setTime(now - 45 * 60 * 1000);

    const type: OrderType = rng() > 0.45 ? "delivery" : "pickup";
    const items = buildItems(rng);
    const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
    const deliveryFee = type === "delivery" ? (subtotal >= 45 ? 0 : pick(rng, [3, 5, 8])) : 0;

    const method: PaymentMethod = pick(rng, ["cash", "cash", "paypal", "card", "card"]);
    const cancelled = rng() > 0.94;
    const isToday = daysAgo === 0;

    let status: OrderStatus;
    if (cancelled) {
      status = "cancelled";
    } else if (isToday && rng() > 0.45) {
      status = pick(rng, type === "delivery" ? ["new", "accepted", "preparing", "on_the_way"] : ["new", "accepted", "preparing", "ready"]);
    } else {
      status = type === "delivery" ? "delivered" : "completed";
    }

    const paymentStatus: PaymentStatus =
      method === "cash"
        ? status === "delivered" || status === "completed"
          ? "paid"
          : "pending"
        : cancelled
          ? "refunded"
          : "paid";

    const estimatedMinutes = type === "delivery" ? 40 + Math.floor(rng() * 20) : 20 + Math.floor(rng() * 15);
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);

    orders.push({
      id: `demo-order-${index}`,
      number: `ZO-${1000 + index}`,
      createdAt: createdAt.toISOString(),
      type,
      status,
      items,
      customer: {
        name: `${firstName} ${lastName}`,
        phone: `+49 17${Math.floor(rng() * 9)} ${Math.floor(1000000 + rng() * 8999999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        ...(type === "delivery"
          ? {
              street: pick(rng, STREETS),
              houseNumber: String(1 + Math.floor(rng() * 180)),
              zip: pick(rng, ["12045", "12047", "12049", "12053", "10967"]),
              city: "Berlin",
              addressExtra: rng() > 0.7 ? `${1 + Math.floor(rng() * 5)}. Stock` : undefined,
            }
          : {}),
        comment: pick(rng, COMMENTS) || undefined,
      },
      payment: {
        method,
        status: paymentStatus,
        provider: method === "cash" ? "cash" : "demo",
        reference: method === "cash" ? undefined : `demo_${Math.floor(rng() * 1e10).toString(36)}`,
      },
      subtotal: Number(subtotal.toFixed(2)),
      deliveryFee,
      total: Number((subtotal + deliveryFee).toFixed(2)),
      distanceKm: type === "delivery" ? Number((rng() * 9 + 0.5).toFixed(1)) : undefined,
      zoneLabel: type === "delivery" ? (deliveryFee === 0 ? "0–3 km" : deliveryFee === 3 ? "0–3 km" : deliveryFee === 5 ? "3–5 km" : "5–10 km") : undefined,
      estimatedMinutes,
      estimatedReadyAt: new Date(createdAt.getTime() + estimatedMinutes * 60 * 1000).toISOString(),
      statusHistory: [{ status: "new", at: createdAt.toISOString() }],
    });
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
