import type { CapperStats } from "@/lib/types";

// "all" is live picks plus on chain history, the leaderboard's default; "live" is only picks logged here.
export type RecordScope = "all" | "live";

export type ScopedRecord = {
  picks: number;
  graded: number;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  unitsRisked: number;
  roi: number;
};

function withRoi(record: Omit<ScopedRecord, "roi" | "graded">): ScopedRecord {
  return {
    ...record,
    graded: record.wins + record.losses + record.pushes,
    roi: record.unitsRisked > 0 ? record.units / record.unitsRisked : 0,
  };
}

export function liveRecord(stats: CapperStats): ScopedRecord {
  return withRoi({
    picks: stats.picks,
    wins: stats.wins,
    losses: stats.losses,
    pushes: stats.pushes,
    units: stats.units,
    unitsRisked: stats.unitsRisked,
  });
}

export function historyRecord(stats: CapperStats): ScopedRecord | null {
  const history = stats.history;
  if (!history) return null;
  return withRoi({
    picks: history.picks,
    wins: history.wins,
    losses: history.losses,
    pushes: history.pushes,
    units: history.units,
    unitsRisked: history.unitsRisked,
  });
}

export function scopedRecord(
  stats: CapperStats,
  scope: RecordScope,
): ScopedRecord {
  const live = liveRecord(stats);
  const history = historyRecord(stats);
  if (scope === "live" || !history) return live;
  return withRoi({
    picks: live.picks + history.picks,
    wins: live.wins + history.wins,
    losses: live.losses + history.losses,
    pushes: live.pushes + history.pushes,
    units: live.units + history.units,
    unitsRisked: live.unitsRisked + history.unitsRisked,
  });
}

// The scope a surface labels: "all" only when there is history to add.
export function defaultScope(stats: CapperStats): RecordScope {
  return stats.history ? "all" : "live";
}
