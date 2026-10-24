import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import type { LeaderboardScope } from "@/lib/api/typebox/leaderboard";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import type { SportGroup } from "@/lib/config/sports";
import type { Messages, useTranslations } from "next-intl";

export type TranslationKey = Parameters<
  ReturnType<typeof useTranslations<never>>
>[0];

type PlainLeaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? T[K] extends `${string}{${string}`
      ? never
      : `${P}${K}`
    : PlainLeaves<T[K], `${P}${K}.`>;
}[keyof T & string];

// Keys whose message takes no ICU argument, so `t(key)` accepts the union.
export type PlainTranslationKey = Extract<
  TranslationKey,
  PlainLeaves<Messages>
>;

export type ApiEvent = {
  id: string;
  home: string;
  away: string;
  commenceTime: string;
  homeImage?: string | null;
  awayImage?: string | null;
  homeCountry?: string | null;
  awayCountry?: string | null;
};

export type ApiMoneyline = {
  bookmaker: string;
  home: number;
  away: number;
};

export type ApiBoardEvent = ApiEvent & { moneyline: ApiMoneyline | null };

// Moneylines are indicative and cached; the pick price is captured fresh on create.
export type ApiBoard = {
  sportKey: string;
  events: ApiBoardEvent[];
  pricedAt: string | null;
  imagesPending: boolean;
};

export type ApiPickSource = {
  platform: SourcePlatform;
  url: string;
  postedAt: string;
};

export type ApiProfileSource = {
  platform: SourcePlatform;
  url: string;
};

export type ApiPick = {
  id: string;
  sequence: number;
  username: string;
  sportKey: string;
  eventId: string;
  home: string;
  away: string;
  commenceTime: string;
  market: string;
  selection: string;
  point: number | null;
  units: number;
  odds: number;
  bookmaker: string;
  result: PickResult;
  createdAt: string;
  homeImage?: string | null;
  awayImage?: string | null;
  homeCountry?: string | null;
  awayCountry?: string | null;
  closingOdds?: number;
  clv?: number;
  logSeq?: number | null;
  source?: ApiPickSource;
};

export type LogHead = {
  size: number;
  root: string;
  updatedAt: string | null;
};

export type LogEntry = {
  seq: number;
  pickId: string;
  username: string;
  leaf: string;
  prevRoot: string;
  root: string;
  canonical: string;
};

export type LogExportEntry = LogEntry & {
  loggedAt: string;
};

export type LogExportPage = {
  entries: LogExportEntry[];
  next: number | null;
};

export type ApiLogAnchor = {
  id: number;
  root: string;
  size: number;
  upgraded: boolean;
  createdAt: string;
  download: string;
};

export type ApiSettledPick = ApiPick & {
  settledAt: string;
};

export type CapperStats = {
  username: string;
  discordUserId: string | null;
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  units: number;
  unitsRisked: number;
  roi: number;
  clv?: number;
  clvSample?: number;
  source: ApiProfileSource | null;
  history?: HistoryStats;
};

// On chain trades imported after the fact, kept apart from the live record above.
export type HistoryStats = {
  picks: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  units: number;
  unitsRisked: number;
  roi: number;
};

export type ApiHistoryPick = {
  id: number;
  platform: SourcePlatform;
  url: string;
  tradedAt: string;
  commenceTime: string;
  sportKey: string;
  home: string;
  away: string;
  market: PickMarket;
  selection: string;
  point: number | null;
  odds: number;
  units: number;
  result: PickResult;
  gradedAt: string;
};

export type RecapResponse = {
  from: string;
  to: string;
  cappers: CapperStats[];
};

export type AuthUser = {
  id: number;
  discordId: string | null;
  username: string;
  avatarUrl: string | null;
};

export type AuthProviders = {
  google: boolean;
  telegramBot: string | null;
};

export type ApiOddsOutcome = {
  name: string;
  point: number | null;
  odds: number;
  selection: string;
};

export type ApiMarketOdds = {
  market: PickMarket;
  bookmaker: string;
  outcomes: ApiOddsOutcome[];
};

export type ApiEventOdds = {
  eventId: string;
  home: string;
  away: string;
  commenceTime: string;
  markets: ApiMarketOdds[];
};

export type LeaderboardRow = {
  rank: number;
  username: string;
  picks: number;
  graded: number;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  unitsRisked: number;
  roi: number;
  sports: SportGroup[];
  source: SourcePlatform | null;
  gradedLive: number;
  gradedHistory: number;
};

export type UnrankedRow = Omit<LeaderboardRow, "rank">;

export type LeaderboardResponse = {
  rows: LeaderboardRow[];
  unranked: UnrankedRow[];
  scope: LeaderboardScope;
  minGraded: number;
  total: number;
  page: number;
  pageSize: number;
};

export type LandingEvent = ApiEvent & { sportKey: string; sportName: string };

export type LandingPrice = {
  selection: string;
  bookmaker: string;
  oddsDecimal: number;
  capturedAt: string;
};

export type LandingStats = {
  results: { win: number; loss: number; push: number; void: number };
  clv: { taken: number; close: number; clv: number } | null;
  lastResult: { result: PickResult; units: number } | null;
  head: LogHead;
  latest: { pickId: string; canonical: string } | null;
  top: { username: string; roi: number }[];
};

export type LandingData = {
  event: LandingEvent | null;
  price: LandingPrice | null;
  stats: LandingStats | null;
  minGraded: number;
};
