"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { DataTable } from "@/components/elements/table/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useLogAnchorsQuery } from "@/hooks/log/log-hook";
import type { TableFeats } from "@/lib/config/table-features";
import type { ApiLogAnchor } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format/date";
import { apiErrorText } from "@/lib/utils/api-error";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";

export function LogAnchors() {
  const t = useTranslations("VERIFY.ANCHORS");
  const tRoot = useTranslations();
  const locale = useLocale();
  const anchors = useLogAnchorsQuery();

  const columns: ColumnDef<TableFeats, ApiLogAnchor>[] = [
    {
      id: "date",
      header: t("COLUMNS.DATE"),
      size: 150,
      meta: { cellClassName: "tabular whitespace-nowrap" },
      cell: ({ row }) => formatDateTime(row.original.createdAt, locale),
    },
    {
      id: "size",
      header: t("COLUMNS.SIZE"),
      size: 70,
      meta: {
        headerClassName: "text-right",
        cellClassName: "tabular text-right",
      },
      cell: ({ row }) => row.original.size.toLocaleString(locale),
    },
    {
      id: "status",
      header: t("COLUMNS.STATUS"),
      size: 130,
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.upgraded ? t("CONFIRMED") : t("PENDING")}
        </Badge>
      ),
    },
    {
      id: "root",
      header: t("COLUMNS.ROOT"),
      size: 320,
      meta: {
        cellClassName:
          "text-muted-foreground font-mono text-xs break-all whitespace-normal",
      },
      cell: ({ row }) => row.original.root,
    },
    {
      id: "download",
      header: "",
      size: 130,
      meta: { cellClassName: "text-right" },
      cell: ({ row }) => (
        <a
          href={row.original.download}
          download
          className="text-primary inline-flex items-center gap-1.5 text-sm whitespace-nowrap hover:underline"
        >
          <Icon name="download" className="size-4" />
          {t("DOWNLOAD")}
        </a>
      ),
    },
  ];

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("TITLE")}</CardTitle>
        <CardDescription>{t("DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {anchors.isError ? (
          <p className="text-destructive text-sm">
            {apiErrorText(tRoot, anchors.error, t("ERROR"))}
          </p>
        ) : (
          <DataTable
            id="LOG_ANCHORS"
            data={anchors.data ?? []}
            columns={columns}
            isLoading={anchors.isPending}
            emptyState={
              <span className="text-muted-foreground text-sm">
                {t("EMPTY")}
              </span>
            }
          />
        )}
        <p className="text-muted-foreground text-sm">{t("HINT")}</p>
        <p className="bg-muted rounded-md px-3 py-2 font-mono text-xs break-all">
          ots verify -d &lt;root&gt; opencapper-log-&lt;size&gt;.ots
        </p>
      </CardContent>
    </Card>
  );
}
