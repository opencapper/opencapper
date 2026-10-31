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
import {
  formatCount,
  formatPercent,
  formatRecord,
  formatUnits,
} from "@/lib/utils/format/number";
import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { dayjs, formatDate } from "@/lib/utils/format/date";
import type { ColumnDef, Row } from "@tanstack/react-table";
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
      <span className="tabular">
        {formatCount(props.row.graded, props.ctx.locale)}
      </span>
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
      <span className="text-pick-win">
        {formatCount(props.row.wins, props.ctx.locale)}
      </span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-pick-loss">
        {formatCount(props.row.losses, props.ctx.locale)}
      </span>
      <span className="text-muted-foreground"> / </span>
      <span className="text-pick-push">
        {formatCount(props.row.pushes, props.ctx.locale)}
      </span>
    </span>
  );
}

function winRate(row: UnrankedRow): number {
  const decided = row.wins + row.losses;
  return decided > 0 ? row.wins / decided : -1;
}

// Win rate, then wins; the same order the server applies for `sort=record`.
function recordSort(
  a: Row<TableFeats, UnrankedRow>,
  b: Row<TableFeats, UnrankedRow>,
) {
  return (
    winRate(a.original) - winRate(b.original) ||
    a.original.wins - b.original.wins
  );
}

function lastPickValue(row: UnrankedRow): number | undefined {
  return row.lastPickAt ? dayjs(row.lastPickAt).valueOf() : undefined;
}

export function LastPickCell(props: { at: string | null; ctx: CellContext }) {
  const local = useHydrated();
  if (!props.at) return <span className="text-muted-foreground">-</span>;
  return (
    <time
      dateTime={props.at}
      className="text-muted-foreground tabular text-xs whitespace-nowrap"
    >
      {formatDate(props.at, props.ctx.locale, local)}
    </time>
  );
}

// Sortable ids are the server `sort` values; ROI and units sit first for phones.
export function buildLeaderboardColumns(
  ctx: CellContext,
): ColumnDef<TableFeats, LeaderboardRow>[] {
  return [
    {
      id: "rank",
      accessorFn: (row) => row.rank,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.RANK"
        />
      ),
      size: 64,
      cell: ({ row }) => <RankCell rank={row.original.rank} />,
    },
    {
      id: "capper",
      accessorFn: (row) => row.username,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.CAPPER"
        />
      ),
      size: 240,
      meta: { cellClassName: "min-w-40 sm:min-w-44" },
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <CapperCell
            username={row.original.username}
            source={row.original.source}
            avatarUrl={row.original.avatarUrl}
          />
          {/* Phones see only the first columns, so the record and ROI ride along under the name. */}
          <span className="tabular text-muted-foreground pl-8 text-xs whitespace-nowrap sm:hidden">
            {formatRecord(row.original, ctx.locale)},{" "}
            <span className={signTone(row.original.roi)}>
              {ctx.t("LEADERBOARD.MOBILE_ROI", {
                roi: formatPercent(row.original.roi, ctx.locale),
              })}
            </span>
          </span>
        </div>
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
      accessorFn: winRate,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.RECORD"
        />
      ),
      size: 140,
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
      accessorFn: (row) => row.sports.length,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.SPORTS"
        />
      ),
      size: 130,
      meta: { cellClassName: "min-w-32" },
      cell: ({ row }) => <SportsCell row={row.original} ctx={ctx} />,
    },
    {
      id: "last",
      accessorFn: lastPickValue,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.LAST_PICK"
        />
      ),
      size: 150,
      cell: ({ row }) => (
        <LastPickCell at={row.original.lastPickAt} ctx={ctx} />
      ),
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
      accessorFn: (row) => row.username,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.CAPPER"
        />
      ),
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
      accessorFn: (row) => row.graded,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.PROGRESS"
        />
      ),
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
      accessorFn: winRate,
      sortFn: recordSort,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.RECORD"
        />
      ),
      size: 140,
      cell: ({ row }) => <RecordCell row={row.original} ctx={ctx} />,
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
        <span className="text-muted-foreground tabular">
          {formatUnits(row.original.units, ctx.locale)}
        </span>
      ),
    },
    {
      id: "roi",
      accessorFn: (row) => (row.unitsRisked > 0 ? row.roi : undefined),
      sortUndefined: "last",
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
      accessorFn: (row) => row.sports.length,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.SPORTS"
        />
      ),
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
    {
      id: "last",
      accessorFn: lastPickValue,
      sortUndefined: "last",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="LEADERBOARD.COLUMNS.LAST_PICK"
        />
      ),
      size: 150,
      cell: ({ row }) => (
        <LastPickCell at={row.original.lastPickAt} ctx={ctx} />
      ),
    },
  ];
}
