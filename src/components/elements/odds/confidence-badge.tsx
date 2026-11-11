import { Badge } from "@/components/ui/badge";
import type { Confidence } from "@/lib/api/client";
import { confidenceHint, confidenceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STYLE: Record<Confidence, string> = {
  high: "border-success/30 bg-success/10 text-success",
  medium: "border-warning/30 bg-warning/10 text-warning",
  low: "border-border bg-transparent text-muted-foreground",
  check: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function ConfidenceBadge(props: { value: Confidence }) {
  const t = useTranslations();
  return (
    <Badge
      variant="outline"
      title={confidenceHint(props.value, t)}
      className={cn("rounded-sm font-normal", STYLE[props.value])}
    >
      {confidenceLabel(props.value, t)}
    </Badge>
  );
}
