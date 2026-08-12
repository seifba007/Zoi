import { CartItem, Order } from "@/types";
import { Localized } from "@/types";

/** Reporting helpers for the dashboard and the sales page. */

export const lineTotal = (item: CartItem) =>
  (item.unitPrice + item.extras.reduce((sum, extra) => sum + extra.price, 0)) * item.quantity;

export const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

export const isSameDay = (a: Date | string, b: Date | string) => {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

export const filterByRange = (orders: Order[], from: Date, to: Date) =>
  orders.filter((order) => {
    const created = new Date(order.createdAt).getTime();
    return created >= from.getTime() && created <= to.getTime();
  });

export type Summary = {
  orders: number;
  revenue: number;
  averageOrderValue: number;
  onlinePaid: number;
  onlineRevenue: number;
  cash: number;
  cashRevenue: number;
  delivery: number;
  pickup: number;
  cancelled: number;
};

/** Cancelled orders never count towards revenue. */
export const summarize = (orders: Order[]): Summary => {
  const valid = orders.filter((order) => order.status !== "cancelled");
  const revenue = valid.reduce((sum, order) => sum + order.total, 0);

  return {
    orders: valid.length,
    revenue: Number(revenue.toFixed(2)),
    averageOrderValue: valid.length ? Number((revenue / valid.length).toFixed(2)) : 0,
    onlinePaid: valid.filter((order) => order.payment.method !== "cash").length,
    onlineRevenue: Number(
      valid
        .filter((order) => order.payment.method !== "cash")
        .reduce((sum, order) => sum + order.total, 0)
        .toFixed(2)
    ),
    cash: valid.filter((order) => order.payment.method === "cash").length,
    cashRevenue: Number(
      valid
        .filter((order) => order.payment.method === "cash")
        .reduce((sum, order) => sum + order.total, 0)
        .toFixed(2)
    ),
    delivery: valid.filter((order) => order.type === "delivery").length,
    pickup: valid.filter((order) => order.type === "pickup").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };
};

/** Revenue and order count for each of the last `days` calendar days. */
export const revenueByDay = (orders: Order[], days = 7) => {
  const today = startOfDay(new Date());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));

    const dayOrders = orders.filter(
      (order) => order.status !== "cancelled" && isSameDay(order.createdAt, date)
    );

    return {
      date,
      revenue: Number(dayOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)),
      orders: dayOrders.length,
    };
  });
};

/** Order volume per hour of the service window. */
export const ordersByHour = (orders: Order[], fromHour = 11, toHour = 23) =>
  Array.from({ length: toHour - fromHour + 1 }, (_, index) => {
    const hour = fromHour + index;
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      orders: orders.filter(
        (order) => order.status !== "cancelled" && new Date(order.createdAt).getHours() === hour
      ).length,
    };
  });

export type TopProduct = { productId: string; name: Localized; quantity: number; revenue: number };

export const topProducts = (orders: Order[], limit = 6): TopProduct[] => {
  const totals = new Map<string, TopProduct>();

  orders
    .filter((order) => order.status !== "cancelled")
    .forEach((order) =>
      order.items.forEach((item) => {
        const existing = totals.get(item.productId);
        const revenue = lineTotal(item);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue = Number((existing.revenue + revenue).toFixed(2));
        } else {
          totals.set(item.productId, {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            revenue: Number(revenue.toFixed(2)),
          });
        }
      })
    );

  return [...totals.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
};

/** Orders that still need attention from the kitchen. */
export const activeOrders = (orders: Order[]) =>
  orders.filter((order) =>
    ["new", "accepted", "preparing", "ready", "on_the_way"].includes(order.status)
  );
