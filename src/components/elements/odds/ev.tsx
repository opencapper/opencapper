import { percent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function evTone(value: number): string {
  if (value > 0) return "text-success";
  if (value < -0.05) return "text-destructive";
  return "text-muted-foreground";
}

export function Ev(props: { value: number | null | undefined; className?: string }) {
  const t = useTranslations("FORMAT");
  if (props.value === null || props.value === undefined)
    return <span className="text-muted-foreground">{t("NA")}</span>;
  return (
    <span className={cn("tabular", evTone(props.value), props.className)}>
      {percent(props.value)}
    </span>
  );
}
