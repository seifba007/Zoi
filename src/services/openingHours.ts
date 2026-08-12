import { OpeningState, RestaurantSettings } from "@/types";

/**
 * Ordering window logic.
 *
 * The website itself is always reachable — this only decides whether the
 * *ordering* flow is unlocked (default: every day 12:15–21:45).
 */

export const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const toTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const toDateKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const hoursFor = (settings: RestaurantSettings, weekday: number) =>
  settings.hours.find((entry) => entry.weekday === weekday);

const isClosedDate = (settings: RestaurantSettings, date: Date) =>
  settings.closures.some((closure) => closure.date === toDateKey(date));

/** Finds the next moment the restaurant accepts orders, looking up to a week ahead. */
const findNextOpening = (settings: RestaurantSettings, from: Date): Date | undefined => {
  for (let offset = 0; offset <= 7; offset += 1) {
    const day = new Date(from);
    day.setDate(from.getDate() + offset);

    const hours = hoursFor(settings, day.getDay());
    if (!hours?.open || isClosedDate(settings, day)) continue;

    const opensAt = new Date(day);
    const [openHour, openMinute] = hours.from.split(":").map(Number);
    opensAt.setHours(openHour, openMinute, 0, 0);

    if (opensAt.getTime() > from.getTime()) return opensAt;

    // Still inside today's window? Then "now" is the next opening.
    if (offset === 0 && toMinutes(hours.to) > from.getHours() * 60 + from.getMinutes()) {
      return from;
    }
  }
  return undefined;
};

export const getOpeningState = (
  settings: RestaurantSettings,
  now: Date = new Date()
): OpeningState => {
  const todayHours = hoursFor(settings, now.getDay());
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const buildClosed = (reason: OpeningState["reason"]): OpeningState => {
    const nextOpenAt = findNextOpening(settings, now);
    return {
      isOpen: false,
      nextOpenAt,
      nextOpenLabel: nextOpenAt
        ? `${String(nextOpenAt.getHours()).padStart(2, "0")}:${String(nextOpenAt.getMinutes()).padStart(2, "0")}`
        : undefined,
      todayHours,
      reason,
    };
  };

  if (settings.temporarilyClosed) return buildClosed("temporary");
  if (isClosedDate(settings, now)) return buildClosed("closure");
  if (!todayHours?.open) return buildClosed("hours");

  const opensAt = toMinutes(todayHours.from);
  const closesAt = toMinutes(todayHours.to);

  if (nowMinutes >= opensAt && nowMinutes < closesAt) {
    return { isOpen: true, closesAt: todayHours.to, todayHours };
  }

  return buildClosed("hours");
};

/** True when the next opening happens on a later calendar day than `now`. */
export const isNextDay = (nextOpenAt: Date | undefined, now: Date = new Date()) =>
  Boolean(nextOpenAt && toDateKey(nextOpenAt) !== toDateKey(now));

/** True when the next opening is exactly tomorrow. */
export const isTomorrow = (nextOpenAt: Date | undefined, now: Date = new Date()) => {
  if (!nextOpenAt) return false;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return toDateKey(nextOpenAt) === toDateKey(tomorrow);
};
