"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogAnchorsQuery } from "@/hooks/log/log-hook";
import { formatDateTime } from "@/lib/utils/format/date";
import { apiErrorText } from "@/lib/utils/api-error";
import { useLocale, useTranslations } from "next-intl";

export function LogAnchors() {
  const t = useTranslations("VERIFY.ANCHORS");
  const tRoot = useTranslations();
  const locale = useLocale();
  const anchors = useLogAnchorsQuery();

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("TITLE")}</CardTitle>
        <CardDescription>{t("DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {anchors.isPending && <Skeleton className="h-20 rounded-xl" />}
        {anchors.isError && (
          <p className="text-destructive text-sm">
            {apiErrorText(tRoot, anchors.error, t("ERROR"))}
          </p>
        )}
        {anchors.data && anchors.data.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("EMPTY")}</p>
        )}
        {anchors.data && anchors.data.length > 0 && (
          <ul className="divide-border divide-y">
            {anchors.data.map((anchor) => (
              <li
                key={anchor.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="tabular">
                      {formatDateTime(anchor.createdAt, locale)}
                    </span>
                    <span className="text-muted-foreground tabular">
                      {t("SIZE", { count: anchor.size })}
                    </span>
                    <Badge variant="outline">
                      {anchor.upgraded ? t("CONFIRMED") : t("PENDING")}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 font-mono text-xs break-all">
                    {anchor.root}
                  </p>
                </div>
                <a
                  href={anchor.download}
                  download
                  className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm hover:underline"
                >
                  <Icon name="download" className="size-4" />
                  {t("DOWNLOAD")}
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="text-muted-foreground text-sm">{t("HINT")}</p>
        <p className="bg-muted rounded-md px-3 py-2 font-mono text-xs break-all">
          ots verify -d &lt;root&gt; opencapper-log-&lt;size&gt;.ots
        </p>
      </CardContent>
    </Card>
  );
}
