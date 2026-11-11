"use client";

import type { LiveStatus } from "@/lib/live/socket";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const DOT: Record<LiveStatus, string> = {
  connecting: "bg-muted-foreground/60",
  live: "bg-success animate-pulse motion-reduce:animate-none",
  reconnecting: "bg-warning",
  offline: "bg-muted-foreground/60",
};

const LABEL = {
  connecting: "LIVE.CONNECTING",
  live: "LIVE.LIVE",
  reconnecting: "LIVE.RECONNECTING",
  offline: "LIVE.OFFLINE",
} as const satisfies Record<LiveStatus, string>;

export function LiveStatusBadge(props: {
  status: LiveStatus;
  className?: string;
}) {
  const t = useTranslations();
  return (
    <span
      role="status"
      title={
        props.status === "live" ? t("LIVE.HINT_LIVE") : t("LIVE.HINT_FALLBACK")
      }
      className={cn(
        "label-mono text-foreground/55 inline-flex shrink-0 items-center gap-1.5 text-[10px]",
        props.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[props.status])} />
      {t(LABEL[props.status])}
    </span>
  );
}
