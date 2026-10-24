import type { AdminUsersQuery } from "@/lib/api/typebox/admin";
import type { LeaderboardQuery } from "@/lib/api/typebox/leaderboard";

export const queryKeys = {
  auth: () => ["auth"] as const,
  authProviders: () => ["auth-providers"] as const,
  userPicks: (username: string) => ["user-picks", username] as const,
  userStats: (username: string) => ["user-stats", username] as const,
  userHistory: (username: string) => ["user-history", username] as const,
  myClaims: () => ["my-claims"] as const,
  eventBoard: (sportKey: string) => ["event-board", sportKey] as const,
  eventLeagues: () => ["event-leagues"] as const,
  eventOdds: (sportKey: string, eventId: string) =>
    ["event-odds", sportKey, eventId] as const,
  leaderboard: (query: LeaderboardQuery) => ["leaderboard", query] as const,
  logHead: () => ["log-head"] as const,
  logAnchors: () => ["log-anchors"] as const,
  logVerifyPick: (pickId: number) => ["log-verify", "pick", pickId] as const,
  logVerifyUserSeq: (username: string, seq: number) =>
    ["log-verify", "user", username, seq] as const,
  adminUsersAll: () => ["admin-users"] as const,
  adminUsers: (query: AdminUsersQuery) => ["admin-users", query] as const,
  adminImports: () => ["admin-imports"] as const,
  adminPicks: () => ["admin-picks"] as const,
  adminSystem: () => ["admin-system"] as const,
};
