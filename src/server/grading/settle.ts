import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import type { EventScore } from "@/server/odds/odds.service";
import {
  normalise,
  parseSelection,
  resolveTeam,
} from "@/server/odds/selection";

export type Gradable = {
  sportKey: string;
  market: PickMarket;
  selection: string;
  point: number | null;
};

export type FinalScore = { home: number; away: number };

export function finalScore(event: EventScore): FinalScore | null {
  if (!event.completed || !event.scores) return null;
  const scoreOf = (team: string) => {
    const entry = event.scores?.find(
      (s) => normalise(s.name) === normalise(team),
    );
    const value = entry ? Number(entry.score) : NaN;
    return Number.isFinite(value) ? value : null;
  };
  const home = scoreOf(event.home_team);
  const away = scoreOf(event.away_team);
  return home === null || away === null ? null : { home, away };
}

function byMargin(margin: number): PickResult {
  if (margin > 0) return "win";
  if (margin < 0) return "loss";
  return "push";
}

export function settle(
  pick: Gradable,
  event: Pick<EventScore, "home_team" | "away_team">,
  score: FinalScore,
): PickResult | null {
  const parsed = parseSelection(pick.market, pick.selection);
  if (!parsed) return null;

  if (pick.market === "totals") {
    if (pick.point === null) return null;
    const total = score.home + score.away;
    return byMargin(
      parsed.side === "over" ? total - pick.point : pick.point - total,
    );
  }

  if (pick.market === "h2h" && parsed.side === "draw")
    return score.home === score.away ? "win" : "loss";

  const team = resolveTeam(parsed.side, [event.home_team, event.away_team]);
  if (!team) return null;
  const isHome = team === event.home_team;
  const own = isHome ? score.home : score.away;
  const other = isHome ? score.away : score.home;

  if (pick.market === "spreads") {
    if (pick.point === null) return null;
    return byMargin(own + pick.point - other);
  }

  // Soccer moneyline is three way, so a draw beats both team sides; two way markets refund.
  if (own === other)
    return pick.sportKey.startsWith("soccer_") ? "loss" : "push";
  return byMargin(own - other);
}
