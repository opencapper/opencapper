import type { PickMarket, PickResult } from "@/lib/api/typebox/picks";
import type { LeaderboardScope } from "@/lib/api/typebox/leaderboard";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import type { CheckMatchKind, CheckStatus } from "@/lib/api/typebox/check";
import type {
  PaymentProvider,
  PayoutAccountStatus,
  PlanInterval,
} from "@/lib/api/typebox/payments";
import type { SportGroup } from "@/lib/config/sports";
import type { AuthRole } from "@/lib/config/permissions";
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
  // Ordered at or after the real start: listed, never counted in a record.
  disqualified?: { actualStart: string };
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
  avatarUrl?: string | null;
  history?: HistoryStats;
};

// "bio": a code in the source profile's bio proves ownership; "manual": staff review only.
export type ClaimMode = "bio" | "manual";

export type ApiProfileClaimant = {
  username: string;
  avatarUrl: string | null;
  verifiedAt: string;
};

export type ApiClaimedProfile = {
  username: string;
  platform: SourcePlatform;
};

// A hidden profile answers with zeroed stats and no source, picture or claim details.
export type ProfileStats = CapperStats & {
  hidden: boolean;
  claimedBy: ApiProfileClaimant | null;
  claimed: ApiClaimedProfile[];
  claimMode: ClaimMode | null;
};

export type ClaimChallenge = {
  code: string;
  expiresAt: string;
  platform: SourcePlatform;
  editUrl: string;
};

export type MyClaim = {
  username: string;
  platform: SourcePlatform;
  hidden: boolean;
  verifiedAt: string;
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
  homeImage?: string | null;
  awayImage?: string | null;
  homeCountry?: string | null;
  awayCountry?: string | null;
};

export type CheckRecord = {
  graded: number;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  unitsRisked: number;
  roi: number;
};

export type CheckMatch = {
  username: string;
  avatarUrl: string | null;
  matchedBy: CheckMatchKind;
  status: CheckStatus;
  platform: SourcePlatform | null;
  claimedBy: string | null;
  // Live is every pick locked here; history is imported on chain trades, never live.
  live: CheckRecord & { pending: number };
  history: CheckRecord | null;
  total: CheckRecord;
  lastPickAt: string | null;
};

export type CapperCheck = {
  query: string;
  matches: CheckMatch[];
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
  role: AuthRole;
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
  lastPickAt: string | null;
  source: SourcePlatform | null;
  avatarUrl: string | null;
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

export type LandingFeatured = {
  event: LandingEvent;
  price: LandingPrice | null;
};

export type LandingDashSport = {
  sportKey: string;
  graded: number;
  wins: number;
  losses: number;
  units: number;
};

export type LandingDashTick =
  | {
      kind: "locked";
      key: string;
      at: string;
      username: string;
      market: string;
      selection: string;
      point: number | null;
      odds: number;
    }
  | {
      kind: "graded";
      key: string;
      at: string;
      username: string;
      sequence: number;
      result: PickResult;
    }
  | {
      kind: "anchored";
      key: string;
      at: string;
      size: number;
      upgraded: boolean;
    };

export type DashSource = "discord" | "telegram" | "web" | "polymarket";

export type LandingDashSource = {
  key: DashSource;
  picks: number;
  lastAt: string | null;
};

export type LandingDashCapper = {
  username: string;
  avatarUrl: string | null;
  source: ApiProfileSource | null;
  rank: number | null;
  graded: number;
  gradedLive: number;
  gradedHistory: number;
  wins: number;
  losses: number;
  pushes: number;
  units: number;
  roi: number;
  clv: number | null;
  clvSample: number;
};

export type LandingDashPoint = { at: string; units: number };

export type LandingDash = {
  capper: LandingDashCapper;
  curve: { live: boolean; points: LandingDashPoint[] };
  sports: LandingDashSport[];
  picks: ApiPick[];
  history: ApiHistoryPick[];
  ticker: LandingDashTick[];
  head: LogHead;
  anchor: { size: number; upgraded: boolean; createdAt: string } | null;
  gradedToday: number;
  sources: LandingDashSource[];
};

export type LandingData = {
  event: LandingEvent | null;
  price: LandingPrice | null;
  featured: LandingFeatured[];
  stats: LandingStats | null;
  dash: LandingDash | null;
  minGraded: number;
};

export type OddsCredits = {
  remaining: number | null;
  used: number | null;
  updatedAt: string | null;
};

export type ImporterRun = {
  at: string;
  created: number;
  skipped: number;
  credits: number;
  failed: boolean;
};

export type AdminUser = {
  id: number;
  authUserId: string | null;
  username: string;
  avatarUrl: string | null;
  email: string | null;
  providers: string[];
  role: AuthRole;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  picks: number;
  createdAt: string;
};

export type AdminUsersPage = {
  rows: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminImportedProfile = {
  id: number;
  username: string;
  avatarUrl: string | null;
  platform: SourcePlatform;
  handle: string;
  url: string;
  picks: number;
  historyPicks: number;
  lastImportAt: string | null;
  hiddenAt: string | null;
  claimedBy: string | null;
};

export type AdminPick = ApiPick & { avatarUrl: string | null };

export type AdminImporterStatus = {
  platform: SourcePlatform;
  enabled: boolean;
  lastRun: ImporterRun | null;
};

export type AdminSystem = {
  oddsConfigured: boolean;
  oddsCredits: OddsCredits;
  board: { used: number; limit: number };
  importOddsCreditsPerDay: number;
  historyDays: number;
  gradingEnabled: boolean;
  importers: AdminImporterStatus[];
  log: { head: LogHead; lastAnchor: ApiLogAnchor | null };
  imagesPending: number;
  grading: {
    overdue: number;
    timedOut: number;
    disqualified: number;
  };
};

export type ApiCapperPlan = {
  priceCents: number;
  currency: "usd";
  interval: PlanInterval;
  active: boolean;
};

export type MyPayments = {
  enabled: boolean;
  feeBps: number;
  minGradedPicks: number;
  gradedPicks: number;
  eligible: boolean;
  account: { provider: PaymentProvider; status: PayoutAccountStatus } | null;
  plan: ApiCapperPlan | null;
};

export type PublicCapperPlan = {
  plan: Omit<ApiCapperPlan, "active"> | null;
  subscribed: boolean;
  feeBps: number;
};
