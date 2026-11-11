import type { BetStatus } from "@/lib/api/client";
import type { Translate } from "@/lib/format";

export const BET_STATUSES = ["open", "won", "lost", "push", "void"] as const satisfies BetStatus[];

export function isBetStatus(v: string | undefined): v is BetStatus {
  return BET_STATUSES.some((s) => s === v);
}

export const STATUS_STYLE: Record<BetStatus, string> = {
  open: "border-border text-muted-foreground",
  won: "border-success/30 bg-success/10 text-success",
  lost: "border-destructive/30 bg-destructive/10 text-destructive",
  push: "border-info/30 bg-info/10 text-info",
  void: "border-border text-muted-foreground",
};

export function statusLabel(s: BetStatus, t: Translate): string {
  if (s === "open") return t("TRACKER.STATUS.OPEN");
  if (s === "won") return t("TRACKER.STATUS.WON");
  if (s === "lost") return t("TRACKER.STATUS.LOST");
  if (s === "push") return t("TRACKER.STATUS.PUSH");
  return t("TRACKER.STATUS.VOID");
}
