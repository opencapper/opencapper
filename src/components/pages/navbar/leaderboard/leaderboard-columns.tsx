import { PublicBadge } from "@/components/elements/source/source-badge";
import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import type { TableFeats } from "@/lib/config/table-features";
import type { LeaderboardRow, UnrankedRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPercent, formatUnits } from "@/lib/utils/format/number";
import type { ColumnDef } from "@tanstack/react-table";
import type { useTranslations } from "next-intl";

export type CellContext = {
  t: ReturnType<typeof useTranslations<never>>;
  locale: string;
};

const RIGHT = { headerClassName: "text-right", cellClassName: "text-right" };

export function signTone(value: number) {
  if (value > 0) return "text-pick-win";
  if (value < 0) return "text-pick-loss";
  return undefined;
}

export function RankCell(props: { rank: number }) {
  return <span className="text-muted-foreground tabular">#{props.rank}</span>;
}

export function CapperCell(props: {
  username: string;
  source: LeaderboardRow["source"];
  avatarUrl: string | null;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <CapperAvatar
        username={props.username}
        imageUrl={props.avatarUrl}
        size="sm"
      />
      <Link
        href={{
          pathname: "/u/[username]",
          params: { username: props.username },
        }}
        prefetch={false}
        className="truncate font-medium underline-offset-4 hover:underline"
      >
        @{props.username}
      </Link>
      {props.source && <PublicBadge platform={props.source} />}
    </span>
  );
}

export function SportsCell(props: { row: UnrankedRow; ctx: CellContext }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {props.row.sports.map((group) => (
        <Tooltip key={group}>
          <TooltipTrigger
            render={
              <span
                role="img"
                aria-label={props.ctx.t(sportLabelKey(group))}
                className="text-muted-foreground inline-flex"
              />
            }
          >
            <SportIcon sportKey={group} />
          </TooltipTrigger>
          <TooltipContent>{props.ctx.t(sportLabelKey(group))}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function SampleCell(props: { row: UnrankedRow; ctx: CellContext }) {
  return (
    <span
      className="inline-flex flex-col items-end"
      title={[
        props.ctx.t("LEADERBOARD.SAMPLE_HINT", {
          graded: props.row.graded,
          picks: props.row.picks,
        }),
        props.ctx.t("LEADERBOARD.SPLIT", {
          graded: props.row.graded,
          live: props.row.gradedLive,
          history: props.row.gradedHistory,
        }),
      ].join(". ")}
    >
      <span className="tabular">{props.row.graded}</span>
      {props.row.gradedHistory > 0 && (
        <span className="text-muted-foreground tabular text-[11px] whitespace-nowrap">
          {props.ctx.t("LEADERBOARD.SPLIT_SHORT", {
            live: props.row.gradedLive,
            history: props.row.gradedHistory,
          })}
        </span>
      )}
    </span>
  );
}

export function RecordCell(props: { row: UnrankedRow; ctx: CellContext }) {
  return (
    <span
      className="tabular whitespace-nowrap"
      title={props.ctx.t("LEADERBOARD.RECORD_HINT")}
    >
      <span className="text-pick-win">{props.row.wins}</span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-pick-loss">{props.row.losses}</span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-pick-push">{props.row.pushes}</span>
    </span>
  );
}

// Sortable ids are the server `sort` values; ROI and units sit first for phones.
export function buildLeaderboardColumns(
  ctx: CellContext,
): ColumnDef<TableFeats, LeaderboardRow>[] {
  return [
    {
      id: "rank",
      header: ctx.t("LEADERBOARD.COLUMNS.RANK"),
      enableSorting: false,
      size: 60,
      cell: ({ row }) => <RankCell rank={row.original.rank} />,
    },
    {
      id: "capper",
      header: ctx.t("LEADERBOARD.COLUMNS.CAPPER"),
      enableSorting: false,
      size: 240,
      meta: { cellClassName: "min-w-44" },
      cell: ({ row }) => (
        <CapperCell
          username={row.original.username}
          source={row.original.source}
          avatarUrl={row.original.avatarUrl}
        />
      ),
    },
    {
      id: "roi",
      accessorFn: (row) => row.roi,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.ROI"
          className="justify-end"
        />
      ),
      size: 100,
      meta: RIGHT,
      cell: ({ row }) => (
        <span
          className={cn("tabular font-semibold", signTone(row.original.roi))}
        >
          {formatPercent(row.original.roi, ctx.locale)}
        </span>
      ),
    },
    {
      id: "units",
      accessorFn: (row) => row.units,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.UNITS"
          className="justify-end"
        />
      ),
      size: 100,
      meta: RIGHT,
      cell: ({ row }) => (
        <span className={cn("tabular", signTone(row.original.units))}>
          {formatUnits(row.original.units, ctx.locale)}
        </span>
      ),
    },
    {
      id: "record",
      header: ctx.t("LEADERBOARD.COLUMNS.RECORD"),
      enableSorting: false,
      size: 120,
      cell: ({ row }) => <RecordCell row={row.original} ctx={ctx} />,
    },
    {
      id: "picks",
      accessorFn: (row) => row.graded,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.SAMPLE"
          className="justify-end"
        />
      ),
      size: 130,
      meta: RIGHT,
      cell: ({ row }) => <SampleCell row={row.original} ctx={ctx} />,
    },
    {
      id: "sports",
      header: ctx.t("LEADERBOARD.COLUMNS.SPORTS"),
      enableSorting: false,
      size: 130,
      meta: { cellClassName: "min-w-32" },
      cell: ({ row }) => <SportsCell row={row.original} ctx={ctx} />,
    },
  ];
}

export function buildUnrankedColumns(
  ctx: CellContext,
  minGraded: number,
): ColumnDef<TableFeats, UnrankedRow>[] {
  return [
    {
      id: "capper",
      header: ctx.t("LEADERBOARD.COLUMNS.CAPPER"),
      size: 240,
      meta: { cellClassName: "min-w-44" },
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate">
            <CapperCell
              username={row.original.username}
              source={row.original.source}
              avatarUrl={row.original.avatarUrl}
            />
          </span>
          <span className="text-muted-foreground tabular text-xs">
            {ctx.t("LEADERBOARD.UNRANKED.PICKS", {
              count: row.original.picks,
            })}
          </span>
        </div>
      ),
    },
    {
      id: "progress",
      header: ctx.t("LEADERBOARD.COLUMNS.PROGRESS"),
      size: 180,
      meta: { cellClassName: "min-w-36" },
      cell: ({ row }) => {
        const label = ctx.t("LEADERBOARD.UNRANKED.PROGRESS", {
          graded: row.original.graded,
          min: minGraded,
        });
        return (
          <div className="flex flex-col gap-1.5">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={minGraded}
              aria-valuenow={row.original.graded}
              aria-label={label}
              className="bg-foreground/8 h-1.5 w-full overflow-hidden rounded-full"
            >
              <div
                className="bg-foreground/50 h-full rounded-full"
                style={{
                  width: `${Math.min(1, row.original.graded / minGraded) * 100}%`,
                }}
              />
            </div>
            <span className="text-muted-foreground tabular text-xs">
              {label}
            </span>
          </div>
        );
      },
    },
    {
      id: "record",
      header: ctx.t("LEADERBOARD.COLUMNS.RECORD"),
      size: 120,
      cell: ({ row }) => <RecordCell row={row.original} ctx={ctx} />,
    },
    {
      id: "units",
      header: ctx.t("LEADERBOARD.COLUMNS.UNITS"),
      size: 100,
      meta: RIGHT,
      cell: ({ row }) => (
        <span className="text-muted-foreground tabular">
          {formatUnits(row.original.units, ctx.locale)}
        </span>
      ),
    },
    {
      id: "roi",
      header: ctx.t("LEADERBOARD.COLUMNS.ROI"),
      size: 100,
      meta: RIGHT,
      cell: ({ row }) => (
        <span
          className={cn(
            "text-muted-foreground tabular opacity-60",
            row.original.unitsRisked === 0 && "opacity-40",
          )}
          title={ctx.t("LEADERBOARD.UNRANKED.SMALL_SAMPLE", {
            count: row.original.graded,
          })}
        >
          {row.original.unitsRisked > 0
            ? formatPercent(row.original.roi, ctx.locale)
            : ctx.t("PROFILE.STATS.NO_ROI")}
        </span>
      ),
    },
    {
      id: "sports",
      header: ctx.t("LEADERBOARD.COLUMNS.SPORTS"),
      size: 150,
      meta: { cellClassName: "min-w-32" },
      cell: ({ row }) => (
        <div className="flex items-center justify-between gap-3">
          <SportsCell row={row.original} ctx={ctx} />
          {row.original.gradedHistory > 0 && (
            <SampleCell row={row.original} ctx={ctx} />
          )}
        </div>
      ),
    },
  ];
}
