import {
  RANKING_DEFAULTS,
  isProofMarkerStyle,
  type RankingConfig,
} from "@/lib/config/ranking";

function nonNegativeInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw?.trim());
  return raw?.trim() && Number.isInteger(n) && n >= 0 ? n : fallback;
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw?.trim());
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

import { POLYMARKET_GAMMA_BASE } from "@/server/constants";

export const serverEnv = {
  get databaseUrl() {
    return process.env.DATABASE_URL;
  },
  get oddsApiKey() {
    return process.env.ODDS_API_KEY;
  },
  get theSportsDbApiKey() {
    return process.env.THESPORTSDB_API_KEY?.trim() || "123";
  },
  get botApiToken() {
    return process.env.BOT_API_TOKEN;
  },
  get gradingEnabled() {
    return process.env.GRADING_ENABLED?.trim().toLowerCase() !== "false";
  },
  get importPolymarketEnabled() {
    return (
      process.env.IMPORT_POLYMARKET_ENABLED?.trim().toLowerCase() === "true"
    );
  },
  // Days of on chain Polymarket history backfilled once at startup; 0 disables it.
  get importPolymarketHistoryDays() {
    return nonNegativeInt(process.env.IMPORT_POLYMARKET_HISTORY_DAYS, 90);
  },
  // Odds API credits the importers may spend per UTC day; 0 prices every import from the source itself.
  get importOddsCreditsPerDay() {
    return nonNegativeInt(process.env.IMPORT_ODDS_CREDITS_PER_DAY, 0);
  },
  // Odds API credits the pick board may spend per UTC day (2 per sport refresh); 0 lists events without prices.
  get boardOddsCreditsPerDay() {
    return nonNegativeInt(process.env.BOARD_ODDS_CREDITS_PER_DAY, 20);
  },
  // Odds API credits picks and pick form lines may spend per UTC day across all users (2 per pick, 6 per uncached lines view).
  get userOddsCreditsPerDay() {
    return nonNegativeInt(process.env.USER_ODDS_CREDITS_PER_DAY, 100);
  },
  // Below this many remaining credits only grading and closing capture may call the Odds API.
  get oddsCreditsReserve() {
    return nonNegativeInt(process.env.ODDS_CREDITS_RESERVE, 100);
  },
  // Override for a local stub; production always uses the public gamma API.
  get polymarketGammaBase() {
    return (
      process.env.POLYMARKET_GAMMA_BASE?.trim().replace(/\/+$/, "") ||
      POLYMARKET_GAMMA_BASE
    );
  },
  get reddit() {
    const value = (key: string) => process.env[key]?.trim() ?? "";
    return {
      clientId: value("REDDIT_CLIENT_ID"),
      clientSecret: value("REDDIT_CLIENT_SECRET"),
      username: value("REDDIT_USERNAME"),
      password: value("REDDIT_PASSWORD"),
      userAgent: value("REDDIT_USER_AGENT"),
    };
  },
  get importRedditEnabled() {
    const reddit = this.reddit;
    return Boolean(
      reddit.clientId &&
      reddit.clientSecret &&
      reddit.username &&
      reddit.password &&
      reddit.userAgent,
    );
  },
  get discordClientId() {
    return process.env.DISCORD_CLIENT_ID?.trim() ?? "";
  },
  get discordClientSecret() {
    return process.env.DISCORD_CLIENT_SECRET?.trim() ?? "";
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  },
  get googleClientSecret() {
    return process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  },
  get googleEnabled() {
    return Boolean(this.googleClientId && this.googleClientSecret);
  },
  get telegramBotToken() {
    return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  },
  get telegramBotUsername() {
    return process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") ?? "";
  },
  get telegramEnabled() {
    return Boolean(this.telegramBotToken && this.telegramBotUsername);
  },
  get betterAuthSecret() {
    return process.env.BETTER_AUTH_SECRET ?? "";
  },
  // Better Auth user ids that always hold every permission, whatever their stored role.
  get adminUserIds(): string[] {
    return (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  },
  // Whop API key permissions: create child companies, update child company fees, company balance read,
  // every payout permission (payout accounts, payout destinations, transfers, withdrawals), checkout
  // configurations, plans, products. Never transfer_ownership. Without key and secret selling is hidden.
  get payments() {
    const apiKey = process.env.WHOP_API_KEY?.trim() ?? "";
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET?.trim() ?? "";
    return {
      enabled: Boolean(apiKey && webhookSecret),
      whopApiKey: apiKey,
      whopWebhookSecret: webhookSecret,
      // Basis points of each sale OpenCapper keeps (500 = 5%).
      feeBps: Math.min(
        nonNegativeInt(process.env.WHOP_PLATFORM_FEE_BPS, 500),
        5000,
      ),
      minGradedPicks: positiveInt(process.env.MIN_GRADED_PICKS_TO_SELL, 30),
    };
  },
  get ranking(): RankingConfig {
    const marker = process.env.PROOF_MARKER_STYLE?.trim();
    return {
      leaderboardMinGradedPicks: positiveInt(
        process.env.LEADERBOARD_MIN_GRADED_PICKS,
        RANKING_DEFAULTS.leaderboardMinGradedPicks,
      ),
      profileMinPicksForRoi: positiveInt(
        process.env.PROFILE_MIN_PICKS_FOR_ROI,
        RANKING_DEFAULTS.profileMinPicksForRoi,
      ),
      proofMarkerStyle: isProofMarkerStyle(marker)
        ? marker
        : RANKING_DEFAULTS.proofMarkerStyle,
    };
  },
};
