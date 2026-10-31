import { Badge } from "@/components/ui/badge";
import type { PickResult } from "@/lib/api/typebox/picks";
import { msg } from "@/lib/config/constants";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STATUS = {
  pending: {
    key: msg("PROFILE.STATUS.PENDING"),
    className: "bg-pick-pending/15 text-pick-pending",
  },
  win: {
    key: msg("PROFILE.STATUS.WIN"),
    className: "bg-pick-win/15 text-pick-win",
  },
  loss: {
    key: msg("PROFILE.STATUS.LOSS"),
    className: "bg-pick-loss/15 text-pick-loss",
  },
  push: {
    key: msg("PROFILE.STATUS.PUSH"),
    className: "bg-pick-push/15 text-pick-push",
  },
  void: {
    key: msg("PROFILE.STATUS.VOID"),
    className: "bg-pick-void/15 text-pick-void",
  },
  half_win: {
    key: msg("PROFILE.STATUS.HALF_WIN"),
    className: "bg-pick-win/15 text-pick-win",
  },
  half_loss: {
    key: msg("PROFILE.STATUS.HALF_LOSS"),
    className: "bg-pick-loss/15 text-pick-loss",
  },
  split: {
    key: msg("PROFILE.STATUS.SPLIT"),
    className: "bg-pick-push/15 text-pick-push",
  },
} satisfies Record<PickResult, { key: string; className: string }>;

export function PickStatusBadge(props: { result: PickResult }) {
  const t = useTranslations();
  const status = STATUS[props.result];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", status.className)}
    >
      {t(status.key)}
    </Badge>
  );
}
