export const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

// Sharp books first: the captured price should be one the market agreed on, not the best outlier.
export const BOOKMAKER_PRIORITY = [
  "pinnacle",
  "betfair_ex_eu",
  "draftkings",
  "fanduel",
  "betmgm",
  "williamhill_us",
  "bet365",
];

export const THESPORTSDB_BASE = "https://www.thesportsdb.com/api/v1/json";

export const DISCORD_CDN_BASE = "https://cdn.discordapp.com";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

// Independent operators, so one calendar going away does not orphan an anchor.
export const OTS_CALENDARS = [
  "https://a.pool.opentimestamps.org",
  "https://b.pool.opentimestamps.org",
  "https://a.pool.eternitywall.com",
];

export const POLYMARKET_GAMMA_BASE = "https://gamma-api.polymarket.com";
export const POLYMARKET_DATA_BASE = "https://data-api.polymarket.com";
export const POLYMARKET_SITE = "https://polymarket.com";
export const POLYGONSCAN_TX = "https://polygonscan.com/tx";
