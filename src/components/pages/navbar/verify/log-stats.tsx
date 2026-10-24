"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useLogAnchorsQuery, useLogHeadQuery } from "@/hooks/log/log-hook";
import type { ApiLogAnchor } from "@/lib/types";
import { formatDate, formatRelative } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";

function stampText(
  t: ReturnType<typeof useTranslations<"VERIFY.STATS">>,
  anchor: ApiLogAnchor | undefined,
  locale: string,
): string {
  if (!anchor) return t("NO_STAMP");
  const date = formatDate(anchor.createdAt, locale);
  return anchor.upgraded
    ? t("STAMP", { date })
    : t("STAMP_PENDING", { date });
}

export function LogStats() {
  const t = useTranslations("VERIFY.STATS");
  const locale = useLocale();
  const head = useLogHeadQuery();
  const anchors = useLogAnchorsQuery();

  if (head.isPending) return <Skeleton className="h-6 w-80 max-w-full" />;
  if (head.isError) return null;
  const parts = [t("SEALED", { count: head.data.size })];
  if (head.data.updatedAt)
    parts.push(
      t("LAST", { time: formatRelative(head.data.updatedAt, locale) }),
    );
  if (anchors.data) parts.push(stampText(t, anchors.data[0], locale));

  return (
    <p className="text-foreground/70 text-sm leading-relaxed">
      {parts.join(", ")}
    </p>
  );
}
