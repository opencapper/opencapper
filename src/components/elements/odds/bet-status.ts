import type { BetStatus } from "@/lib/api/client";
import type { IconName } from "@/lib/config/icon-map";
import type { Translate } from "@/lib/format";

export const BET_STATUSES = [
  "open",
  "won",
  "half_won",
  "lost",
  "half_lost",
  "push",
  "void",
] as const satisfies BetStatus[];

export function isBetStatus(v: string | undefined): v is BetStatus {
  return BET_STATUSES.some((s) => s === v);
}

export const STATUS_STYLE: Record<BetStatus, string> = {
  open: "border-border text-muted-foreground",
  won: "border-success/30 bg-success/10 text-success",
  half_won: "border-success/30 bg-success/5 text-success",
  lost: "border-destructive/30 bg-destructive/10 text-destructive",
  half_lost: "border-destructive/30 bg-destructive/5 text-destructive",
  push: "border-info/30 bg-info/10 text-info",
  void: "border-border text-muted-foreground",
};

export const STATUS_ICON: Record<BetStatus, IconName> = {
  open: "refresh-ccw",
  won: "circle-check",
  half_won: "circle-check",
  lost: "x-circle",
  half_lost: "x-circle",
  push: "scale",
  void: "ban",
};

export function statusLabel(s: BetStatus, t: Translate): string {
  if (s === "open") return t("TRACKER.STATUS.OPEN");
  if (s === "won") return t("TRACKER.STATUS.WON");
  if (s === "half_won") return t("TRACKER.STATUS.HALF_WON");
  if (s === "lost") return t("TRACKER.STATUS.LOST");
  if (s === "half_lost") return t("TRACKER.STATUS.HALF_LOST");
  if (s === "push") return t("TRACKER.STATUS.PUSH");
  return t("TRACKER.STATUS.VOID");
}
