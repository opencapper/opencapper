"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeaderboardRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import {
  CapperCell,
  LEADERBOARD_COLUMNS,
  RankCell,
  SportsCell,
} from "./leaderboard-columns";

export function LeaderboardResults(props: { rows: LeaderboardRow[] }) {
  const t = useTranslations();
  const ctx = { t, locale: useLocale() };
  const stats = LEADERBOARD_COLUMNS.filter((column) => column.stat);

  return (
    <>
      <Card className="hidden py-0 md:flex">
        <Table>
          <TableHeader>
            <TableRow>
              {LEADERBOARD_COLUMNS.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    "label-mono text-foreground/45 px-4 text-[11px] font-normal",
                    column.align === "right" && "text-right",
                  )}
                >
                  {t(column.header)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.rows.map((row) => (
              <TableRow key={row.username}>
                {LEADERBOARD_COLUMNS.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      "px-4 py-3",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {column.cell(row, ctx)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ol className="flex flex-col gap-3 md:hidden">
        {props.rows.map((row) => (
          <li key={row.username}>
            <Card size="sm">
              <CardHeader className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <RankCell rank={row.rank} />
                  <span className="truncate">
                    <CapperCell
                      username={row.username}
                      source={row.source}
                      avatarUrl={row.avatarUrl}
                    />
                  </span>
                </div>
                <SportsCell row={row} ctx={ctx} />
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-3">
                  {stats.map((column) => (
                    <div key={column.id} className="flex flex-col gap-0.5">
                      <dt className="label-mono text-foreground/45 text-[10px]">
                        {t(column.header)}
                      </dt>
                      <dd>{column.cell(row, ctx)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </>
  );
}
