import type { PickMarket, PickResult, PickSpec } from "@/lib/api/typebox/picks";
import { sportShape } from "@/lib/config/markets";
import type { EventResult } from "@/lib/db/schema/server";

export type Gradable = {
  sportKey: string;
  market: PickMarket;
  spec: PickSpec;
  point: number | null;
};

export type ResultFacts = Pick<
  EventResult,
  | "status"
  | "winner"
  | "homeScore"
  | "awayScore"
  | "method"
  | "periodEnded"
  | "periodClock"
>;

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

function winnerOf(facts: ResultFacts): ResultFacts["winner"] {
  if (facts.winner) return facts.winner;
  if (facts.homeScore === null || facts.awayScore === null) return null;
  if (facts.homeScore === facts.awayScore) return "draw";
  return facts.homeScore > facts.awayScore ? "home" : "away";
}

function hit(won: boolean): PickResult {
  return won ? "win" : "loss";
}

// Grades one pick from what happened in its event; null when the facts cannot settle it, so the grader keeps it pending.
export function settle(pick: Gradable, facts: ResultFacts): PickResult | null {
  if (facts.status === "cancelled") return "void";
  if (facts.status !== "final") return null;

  const shape = sportShape(pick.sportKey);
  if (shape && facts.method && shape.voidMethods.includes(facts.method))
    return "void";

  const spec = pick.spec;
  const winner = winnerOf(facts);

  if (pick.market === "totals") {
    if (pick.point === null) return null;
    const periods =
      shape?.periodSeconds && facts.periodEnded !== null
        ? facts.periodEnded - 1 + (facts.periodClock ?? 0) / shape.periodSeconds
        : null;
    const total =
      periods ??
      (facts.homeScore === null || facts.awayScore === null
        ? null
        : facts.homeScore + facts.awayScore);
    if (total === null) return null;
    const over = spec.side === "over";
    return byLine(pick.point, (line) => (over ? total - line : line - total));
  }

  if (pick.market === "spreads") {
    if (
      pick.point === null ||
      facts.homeScore === null ||
      facts.awayScore === null
    )
      return null;
    const own = spec.side === "home" ? facts.homeScore : facts.awayScore;
    const other = spec.side === "home" ? facts.awayScore : facts.homeScore;
    return byLine(pick.point, (line) => own + line - other);
  }

  if (pick.market === "h2h") {
    if (!winner) return null;
    if (spec.side === "draw") return hit(winner === "draw");
    // Soccer moneyline is three way, so a draw beats both team sides; two way markets refund.
    if (winner === "draw")
      return pick.sportKey.startsWith("soccer_") ? "loss" : "push";
    return hit(winner === spec.side);
  }

  if (!shape || !facts.method) return null;
  const wentDistance = shape.distanceMethods.includes(facts.method);

  if (pick.market === "distance") {
    if (spec.side !== "yes" && spec.side !== "no") return null;
    return hit(wentDistance === (spec.side === "yes"));
  }

  if (spec.side === "draw") return hit(winner === "draw");
  if (!winner || winner === "draw") return winner ? "loss" : null;
  const sideWon = spec.side === "any" || spec.side === winner;
  const methodHit = spec.methods ? spec.methods.includes(facts.method) : true;

  if (pick.market === "method") return hit(sideWon && methodHit);

  if (pick.market === "period_win") {
    if (spec.period === null) return hit(sideWon && methodHit);
    if (facts.periodEnded === null) return null;
    // A decision after the last round is not a win in that round.
    return hit(
      sideWon &&
        methodHit &&
        !wentDistance &&
        facts.periodEnded === spec.period,
    );
  }
  return null;
}
