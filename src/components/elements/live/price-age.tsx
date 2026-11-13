"use client";

import { useSecond } from "@/hooks/live/use-second-hook";
import { ago, time } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

// Older than this the price is still listed but no longer fresh; the API drops it at five minutes.
const FRESH_SECONDS = 120;

export function PriceAge(props: {
  iso: string;
  serverNow: number;
  prefix?: string;
  dot?: boolean;
  className?: string;
}) {
  const t = useTranslations("COMMON");
  const locale = useLocale();
  const now = useSecond(props.serverNow);
  const secs = (now - new Date(props.iso).getTime()) / 1000;
  return (
    <span
      title={t("SEEN_AT", { time: time(props.iso, locale) })}
      className={cn(
        "tabular text-muted-foreground inline-flex items-center gap-1.5 text-xs whitespace-nowrap",
        props.className,
      )}
      suppressHydrationWarning
    >
      {props.dot !== false && (
        <span
          aria-hidden
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            secs < FRESH_SECONDS ? "bg-success" : "bg-warning",
          )}
        />
      )}
      {props.prefix && <span className="font-sans">{props.prefix}</span>}
      <span className="min-w-[6ch]">{ago(props.iso, now, locale)}</span>
    </span>
  );
}
