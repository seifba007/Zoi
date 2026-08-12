import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import { getOpeningState, isNextDay, isTomorrow } from "@/services/openingHours";
import { TranslationKey } from "@/i18n/translations";
import { OpeningState } from "@/types";

/**
 * Live ordering window. Re-evaluates every 30 seconds so the site flips from
 * "open" to "closed" at 21:45 without a reload — the site itself never closes.
 */
export const useOpeningStatus = (): OpeningState & { label: string; nextOpenLabelLong: string } => {
  const { settings } = useStore();
  const { t } = useI18n();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => {
    const state = getOpeningState(settings, now);

    const label = state.isOpen
      ? t("status.openUntil", { time: state.closesAt ?? "" })
      : state.nextOpenLabel
        ? isTomorrow(state.nextOpenAt, now)
          ? t("status.opensTomorrow", { time: state.nextOpenLabel })
          : isNextDay(state.nextOpenAt, now)
            ? t("status.opensOn", {
                day: t(`day.${state.nextOpenAt!.getDay()}` as TranslationKey),
                time: state.nextOpenLabel,
              })
            : t("status.opensAt", { time: state.nextOpenLabel })
        : t("status.closed");

    return { ...state, label, nextOpenLabelLong: label };
  }, [settings, now, t]);
};
