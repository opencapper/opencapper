import type { PickSpec } from "@/lib/api/typebox/picks";
import { isMarket, isShapeMarket, sportShape } from "@/lib/config/markets";
import { useTranslations } from "next-intl";

type LabelInput = {
  sportKey: string;
  market: string;
  selection: string;
  spec?: PickSpec | null;
  home: string;
  away: string;
};

const METHOD_KEY = {
  ko: "KO",
  submission: "SUBMISSION",
  decision: "DECISION",
  dq: "DQ",
  draw: "DRAW",
  no_contest: "NO_CONTEST",
} as const;

function isMethod(value: string): value is keyof typeof METHOD_KEY {
  return value in METHOD_KEY;
}

// Shape market selections are stored in English (they are hashed); this shows them in the viewer's language.
export function useSelectionLabel() {
  const t = useTranslations("PICK_LABEL");
  return (input: LabelInput): string => {
    const spec = input.spec;
    const shape = sportShape(input.sportKey);
    if (
      !spec ||
      !shape ||
      !isMarket(input.market) ||
      !isShapeMarket(input.market)
    )
      return input.selection;

    if (input.market === "distance") {
      if (spec.side === "yes") return t("DISTANCE_YES");
      if (spec.side === "no") return t("DISTANCE_NO");
      return input.selection;
    }
    if (spec.side === "draw") return t("METHOD.DRAW");

    const methods = spec.methods ?? [];
    if (!methods.every(isMethod)) return input.selection;
    const method = methods.length
      ? methods
          .filter(isMethod)
          .map((m) => t(`METHOD.${METHOD_KEY[m]}`))
          .join("/")
      : null;
    const who =
      spec.side === "home"
        ? input.home
        : spec.side === "away"
          ? input.away
          : null;
    if (!who) return method ?? input.selection;

    const period = t(`PERIOD.${shape.periodKey}`);
    if (spec.period && method)
      return t("BY_IN_PERIOD", { who, method, period, n: spec.period });
    if (spec.period) return t("IN_PERIOD", { who, period, n: spec.period });
    if (method) return t("BY", { who, method });
    return input.selection;
  };
}
