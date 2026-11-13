export const queryKeys = {
  auth: () => ["auth"] as const,
  valueBets: (book?: string, min?: string) => ["value-bets", book ?? "", min ?? ""] as const,
  boardBets: () => ["board-bets"] as const,
  bet: (id: string) => ["value-bet", id] as const,
  arbs: (all: boolean) => ["arbs", all] as const,
  game: (id: string) => ["game", id] as const,
  ledger: () => ["ledger"] as const,
  ledgerStats: () => ["ledger", "stats"] as const,
  telegram: () => ["telegram"] as const,
};
