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

type WholeResult = "win" | "loss" | "push";

function byMargin(margin: number): WholeResult {
  if (margin > 0) return "win";
  if (margin < 0) return "loss";
  return "push";
}

function isQuarter(point: number) {
  return Math.abs((point * 4) % 2) === 1;
}

// A quarter line (0.25, 2.75) is half the stake on each neighbouring half line: 2.75 is 2.5 plus 3.
function byLine(point: number, margin: (line: number) => number): PickResult {
  if (!isQuarter(point)) return byMargin(margin(point));
  const low = byMargin(margin(point - 0.25));
  const high = byMargin(margin(point + 0.25));
  if (low === high) return low;
  const halves = [low, high];
  if (halves.includes("win") && halves.includes("push")) return "half_win";
  if (halves.includes("loss") && halves.includes("push")) return "half_loss";
  return "split";
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
    const over = parsed.side === "over";
    return byLine(pick.point, (line) => (over ? total - line : line - total));
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
    return byLine(pick.point, (line) => own + line - other);
  }

  // Soccer moneyline is three way, so a draw beats both team sides; two way markets refund.
  if (own === other)
    return pick.sportKey.startsWith("soccer_") ? "loss" : "push";
  return byMargin(own - other);
}
