export const PROOF_MARKER_STYLES = ["outline", "filled"] as const;
export type ProofMarkerStyle = (typeof PROOF_MARKER_STYLES)[number];

export type RankingConfig = {
  // Graded picks before a capper enters the leaderboard.
  leaderboardMinGradedPicks: number;
  // Graded picks before a profile shows ROI at full weight.
  profileMinPicksForRoi: number;
  proofMarkerStyle: ProofMarkerStyle;
};

export const RANKING_DEFAULTS: RankingConfig = {
  leaderboardMinGradedPicks: 50,
  profileMinPicksForRoi: 20,
  proofMarkerStyle: "outline",
};

export function isProofMarkerStyle(v: unknown): v is ProofMarkerStyle {
  return PROOF_MARKER_STYLES.some((s) => s === v);
}
