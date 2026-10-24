import { PublicBadge } from "@/components/elements/source/source-badge";
import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "@/i18n/navigation";
import { msg } from "@/lib/config/constants";
import type {
  LeaderboardRow,
  PlainTranslationKey,
  UnrankedRow,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPercent, formatUnits } from "@/lib/utils/format/number";
import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";

export type CellContext = {
  t: ReturnType<typeof useTranslations<never>>;
  locale: string;
};

export type LeaderboardColumn = {
  id: string;
  header: PlainTranslationKey;
  align?: "right";
  // Stat columns also render in the mobile card grid.
  stat?: boolean;
  cell: (row: LeaderboardRow, ctx: CellContext) => ReactNode;
};

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

export const LEADERBOARD_COLUMNS: LeaderboardColumn[] = [
  {
    id: "rank",
    header: msg("LEADERBOARD.COLUMNS.RANK"),
    cell: (row) => <RankCell rank={row.rank} />,
  },
  {
    id: "capper",
    header: msg("LEADERBOARD.COLUMNS.CAPPER"),
    cell: (row) => (
      <CapperCell
        username={row.username}
        source={row.source}
        avatarUrl={row.avatarUrl}
      />
    ),
  },
  {
    id: "record",
    header: msg("LEADERBOARD.COLUMNS.RECORD"),
    stat: true,
    cell: (row, ctx) => <RecordCell row={row} ctx={ctx} />,
  },
  {
    id: "units",
    header: msg("LEADERBOARD.COLUMNS.UNITS"),
    align: "right",
    stat: true,
    cell: (row, ctx) => (
      <span className={cn("tabular", signTone(row.units))}>
        {formatUnits(row.units, ctx.locale)}
      </span>
    ),
  },
  {
    id: "roi",
    header: msg("LEADERBOARD.COLUMNS.ROI"),
    align: "right",
    stat: true,
    cell: (row, ctx) => (
      <span className={cn("tabular font-semibold", signTone(row.roi))}>
        {formatPercent(row.roi, ctx.locale)}
      </span>
    ),
  },
  {
    id: "sample",
    header: msg("LEADERBOARD.COLUMNS.SAMPLE"),
    align: "right",
    stat: true,
    cell: (row, ctx) => <SampleCell row={row} ctx={ctx} />,
  },
  {
    id: "sports",
    header: msg("LEADERBOARD.COLUMNS.SPORTS"),
    cell: (row, ctx) => <SportsCell row={row} ctx={ctx} />,
  },
];
