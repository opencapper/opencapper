import { STATUS_STYLE, statusLabel } from "@/components/elements/odds/bet-status";
import { Badge } from "@/components/ui/badge";
import type { BetStatus } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ResultBadge(props: { value: BetStatus; className?: string }) {
  const t = useTranslations();
  return (
    <Badge variant="outline" className={cn("rounded-sm font-normal", STATUS_STYLE[props.value], props.className)}>
      {statusLabel(props.value, t)}
    </Badge>
  );
}
