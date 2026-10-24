"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogHeadQuery } from "@/hooks/log/log-hook";
import { formatDateTime } from "@/lib/utils/format/date";
import { apiErrorText } from "@/lib/utils/api-error";
import { useLocale, useTranslations } from "next-intl";
import { HashRow } from "./hash-row";

export function LogHeadCard() {
  const t = useTranslations("VERIFY.HEAD");
  const tRoot = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const head = useLogHeadQuery();

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("TITLE")}</CardTitle>
        <CardDescription>{t("DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent>
        {head.isPending && <Skeleton className="h-20 rounded-xl" />}
        {head.isError && (
          <p className="text-destructive text-sm">
            {apiErrorText(tRoot, head.error, t("ERROR"))}
          </p>
        )}
        {head.data && (
          <dl className="space-y-3">
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-muted-foreground text-sm">{t("SIZE")}</dt>
              <dd className="tabular text-sm">
                {t("SIZE_VALUE", { count: head.data.size })}
              </dd>
            </div>
            <HashRow label={t("ROOT")} value={head.data.root} />
            <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-muted-foreground text-sm">{t("UPDATED")}</dt>
              <dd className="tabular text-sm">
                {head.data.updatedAt
                  ? formatDateTime(head.data.updatedAt, locale, local)
                  : t("EMPTY")}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
