import type { Confidence } from "@/lib/api/client";
import { confidenceHint, confidenceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const BARS: Record<Confidence, number> = { high: 3, medium: 2, low: 1, check: 0 };

// Neutral on purpose: green and red belong to value and results, so confidence is a three bar meter.
export function ConfidenceBadge(props: { value: Confidence; className?: string }) {
  const t = useTranslations();
  const check = props.value === "check";
  return (
    <span
      title={confidenceHint(props.value, t)}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        check ? "text-warning" : "text-foreground/80",
        props.className,
      )}
    >
      <span aria-hidden className="flex items-end gap-[2px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-[1px]",
              i === 0 ? "h-1.5" : i === 1 ? "h-2" : "h-2.5",
              check ? "bg-warning/40" : i < BARS[props.value] ? "bg-foreground/70" : "bg-foreground/15",
            )}
          />
        ))}
      </span>
      {confidenceLabel(props.value, t)}
    </span>
  );
}
