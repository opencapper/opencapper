// Single home for per vendor branding. Files live in public/images/vendors/, sources in SOURCES.md there.
export type VendorKind =
  | "sportsbook"
  | "exchange"
  | "prediction"
  | "dfs"
  | "platform"
  | "storefront"
  | "tracker";

// tile: a full bleed square (app icon), drawn with a radius and a hairline ring.
// glyph: a transparent mark. mono: a black mark drawn in currentColor so it survives the dark theme.
export type VendorLogoShape = "tile" | "glyph" | "mono";

export type Vendor = {
  name: string;
  domain: string;
  primary: string;
  kind: VendorKind;
  logo?: string;
  shape?: VendorLogoShape;
  monogram?: string;
};

const VENDORS = {
  draftkings: {
    name: "DraftKings",
    domain: "draftkings.com",
    primary: "#6cb40c",
    kind: "sportsbook",
    logo: "/images/vendors/draftkings.png",
    shape: "tile",
  },
  fanduel: {
    name: "FanDuel",
    domain: "fanduel.com",
    primary: "#0c246c",
    kind: "sportsbook",
    logo: "/images/vendors/fanduel.png",
    shape: "tile",
  },
  betmgm: {
    name: "BetMGM",
    domain: "betmgm.com",
    primary: "#ccb46c",
    kind: "sportsbook",
    logo: "/images/vendors/betmgm.png",
    shape: "tile",
  },
  williamhill_us: {
    name: "Caesars",
    domain: "caesars.com",
    primary: "#b49c54",
    kind: "sportsbook",
    logo: "/images/vendors/williamhill_us.png",
    shape: "tile",
  },
  espnbet: {
    name: "theScore Bet",
    domain: "thescore.bet",
    primary: "#fcb40c",
    kind: "sportsbook",
    logo: "/images/vendors/espnbet.png",
    shape: "tile",
  },
  fanatics: {
    name: "Fanatics",
    domain: "sportsbook.fanatics.com",
    primary: "#e41d36",
    kind: "sportsbook",
    logo: "/images/vendors/fanatics.png",
    shape: "tile",
  },
  betrivers: {
    name: "BetRivers",
    domain: "betrivers.com",
    primary: "#fcb424",
    kind: "sportsbook",
    logo: "/images/vendors/betrivers.png",
    shape: "tile",
  },
  hardrockbet: {
    name: "Hard Rock Bet",
    domain: "hardrock.bet",
    primary: "#6c3cfc",
    kind: "sportsbook",
    logo: "/images/vendors/hardrockbet.png",
    shape: "tile",
  },
  ballybet: {
    name: "Bally Bet",
    domain: "ballybet.com",
    primary: "#3c246c",
    kind: "sportsbook",
    logo: "/images/vendors/ballybet.png",
    shape: "tile",
  },
  betparx: {
    name: "betPARX",
    domain: "betparx.com",
    primary: "#cc0c54",
    kind: "sportsbook",
    logo: "/images/vendors/betparx.png",
    shape: "tile",
  },
  betonlineag: {
    name: "BetOnline",
    domain: "betonline.ag",
    primary: "#e4002b",
    kind: "sportsbook",
    monogram: "BOL",
  },
  bovada: {
    name: "Bovada",
    domain: "bovada.lv",
    primary: "#cc2424",
    kind: "sportsbook",
    logo: "/images/vendors/bovada.png",
    shape: "tile",
  },
  mybookieag: {
    name: "MyBookie",
    domain: "mybookie.ag",
    primary: "#e46c0c",
    kind: "sportsbook",
    logo: "/images/vendors/mybookieag.png",
    shape: "tile",
  },
  lowvig: {
    name: "LowVig",
    domain: "lowvig.ag",
    primary: "#2f7d32",
    kind: "sportsbook",
    monogram: "LV",
  },
  betus: {
    name: "BetUS",
    domain: "betus.com.pa",
    primary: "#0a3d91",
    kind: "sportsbook",
    logo: "/images/vendors/betus.png",
    shape: "tile",
  },
  pinnacle: {
    name: "Pinnacle",
    domain: "pinnacle.com",
    primary: "#ff5c00",
    kind: "sportsbook",
    monogram: "PIN",
  },
  betfair: {
    name: "Betfair",
    domain: "betfair.com",
    primary: "#fcb40c",
    kind: "exchange",
    logo: "/images/vendors/betfair.png",
    shape: "tile",
  },
  matchbook: {
    name: "Matchbook",
    domain: "matchbook.com",
    primary: "#cc2424",
    kind: "exchange",
    logo: "/images/vendors/matchbook.png",
    shape: "tile",
  },
  smarkets: {
    name: "Smarkets",
    domain: "smarkets.com",
    primary: "#0ccc9c",
    kind: "exchange",
    logo: "/images/vendors/smarkets.png",
    shape: "tile",
  },
  bet365: {
    name: "bet365",
    domain: "bet365.com",
    primary: "#0c6c54",
    kind: "sportsbook",
    logo: "/images/vendors/bet365.png",
    shape: "tile",
  },
  tipico_de: {
    name: "Tipico",
    domain: "tipico.de",
    primary: "#b40c24",
    kind: "sportsbook",
    logo: "/images/vendors/tipico_de.png",
    shape: "tile",
  },
  winamax: {
    name: "Winamax",
    domain: "winamax.fr",
    primary: "#e40c0c",
    kind: "sportsbook",
    logo: "/images/vendors/winamax.png",
    shape: "tile",
  },
  unibet: {
    name: "Unibet",
    domain: "unibet.com",
    primary: "#3cb43c",
    kind: "sportsbook",
    logo: "/images/vendors/unibet.png",
    shape: "tile",
  },
  betway: {
    name: "Betway",
    domain: "betway.com",
    primary: "#00a826",
    kind: "sportsbook",
    logo: "/images/vendors/betway.png",
    shape: "tile",
  },
  williamhill: {
    name: "William Hill",
    domain: "williamhill.com",
    primary: "#0c0c3c",
    kind: "sportsbook",
    logo: "/images/vendors/williamhill.png",
    shape: "tile",
  },
  paddypower: {
    name: "Paddy Power",
    domain: "paddypower.com",
    primary: "#0c543c",
    kind: "sportsbook",
    logo: "/images/vendors/paddypower.png",
    shape: "tile",
  },
  skybet: {
    name: "Sky Bet",
    domain: "skybet.com",
    primary: "#fc0c0c",
    kind: "sportsbook",
    logo: "/images/vendors/skybet.png",
    shape: "tile",
  },
  ladbrokes_uk: {
    name: "Ladbrokes",
    domain: "ladbrokes.com",
    primary: "#fc2424",
    kind: "sportsbook",
    logo: "/images/vendors/ladbrokes_uk.png",
    shape: "tile",
  },
  coral: {
    name: "Coral",
    domain: "coral.co.uk",
    primary: "#0c54e4",
    kind: "sportsbook",
    logo: "/images/vendors/coral.png",
    shape: "tile",
  },
  betvictor: {
    name: "BetVictor",
    domain: "betvictor.com",
    primary: "#6cccfc",
    kind: "sportsbook",
    logo: "/images/vendors/betvictor.png",
    shape: "tile",
  },
  "888sport": {
    name: "888sport",
    domain: "888sport.com",
    primary: "#6ccc3c",
    kind: "sportsbook",
    logo: "/images/vendors/888sport.png",
    shape: "tile",
  },
  betsson: {
    name: "Betsson",
    domain: "betsson.com",
    primary: "#fc6c0c",
    kind: "sportsbook",
    logo: "/images/vendors/betsson.png",
    shape: "tile",
  },
  nordicbet: {
    name: "NordicBet",
    domain: "nordicbet.com",
    primary: "#0c6cb4",
    kind: "sportsbook",
    logo: "/images/vendors/nordicbet.png",
    shape: "tile",
  },
  leovegas: {
    name: "LeoVegas",
    domain: "leovegas.com",
    primary: "#fc543c",
    kind: "sportsbook",
    logo: "/images/vendors/leovegas.png",
    shape: "tile",
  },
  sportsbet: {
    name: "Sportsbet",
    domain: "sportsbet.com.au",
    primary: "#0c549c",
    kind: "sportsbook",
    logo: "/images/vendors/sportsbet.png",
    shape: "tile",
  },
  tab: {
    name: "TAB",
    domain: "tab.com.au",
    primary: "#24e46c",
    kind: "sportsbook",
    logo: "/images/vendors/tab.png",
    shape: "tile",
  },
  neds: {
    name: "Neds",
    domain: "neds.com.au",
    primary: "#fc540c",
    kind: "sportsbook",
    logo: "/images/vendors/neds.png",
    shape: "tile",
  },
  pointsbetau: {
    name: "PointsBet",
    domain: "pointsbet.com.au",
    primary: "#e4243c",
    kind: "sportsbook",
    logo: "/images/vendors/pointsbetau.png",
    shape: "tile",
  },
  polymarket: {
    name: "Polymarket",
    domain: "polymarket.com",
    primary: "#0c54fc",
    kind: "prediction",
    logo: "/images/vendors/polymarket.png",
    shape: "tile",
  },
  kalshi: {
    name: "Kalshi",
    domain: "kalshi.com",
    primary: "#0ccc84",
    kind: "prediction",
    logo: "/images/vendors/kalshi.png",
    shape: "tile",
  },
  novig: {
    name: "Novig",
    domain: "novig.us",
    primary: "#6c5ce7",
    kind: "exchange",
    logo: "/images/vendors/novig.png",
    shape: "tile",
  },
  prophetx: {
    name: "ProphetX",
    domain: "prophetx.co",
    primary: "#0c9c54",
    kind: "exchange",
    logo: "/images/vendors/prophetx.png",
    shape: "tile",
  },
  prizepicks: {
    name: "PrizePicks",
    domain: "prizepicks.com",
    primary: "#840cfc",
    kind: "dfs",
    logo: "/images/vendors/prizepicks.png",
    shape: "tile",
  },
  underdog: {
    name: "Underdog",
    domain: "underdogfantasy.com",
    primary: "#fcfc0c",
    kind: "dfs",
    logo: "/images/vendors/underdog.png",
    shape: "tile",
  },
  sleeper: {
    name: "Sleeper",
    domain: "sleeper.com",
    primary: "#0c243c",
    kind: "dfs",
    logo: "/images/vendors/sleeper.png",
    shape: "tile",
  },
  pick6: {
    name: "DraftKings Pick6",
    domain: "pick6.draftkings.com",
    primary: "#e45424",
    kind: "dfs",
    logo: "/images/vendors/pick6.png",
    shape: "tile",
  },
  discord: {
    name: "Discord",
    domain: "discord.com",
    primary: "#5865f2",
    kind: "platform",
    logo: "/images/vendors/discord.svg",
    shape: "glyph",
  },
  telegram: {
    name: "Telegram",
    domain: "telegram.org",
    primary: "#26a5e4",
    kind: "platform",
    logo: "/images/vendors/telegram.svg",
    shape: "glyph",
  },
  whatsapp: {
    name: "WhatsApp",
    domain: "whatsapp.com",
    primary: "#25d366",
    kind: "platform",
    logo: "/images/vendors/whatsapp.svg",
    shape: "glyph",
  },
  x: {
    name: "X",
    domain: "x.com",
    primary: "#000000",
    kind: "platform",
    logo: "/images/vendors/x.svg",
    shape: "mono",
  },
  reddit: {
    name: "Reddit",
    domain: "reddit.com",
    primary: "#ff4500",
    kind: "platform",
    logo: "/images/vendors/reddit.svg",
    shape: "glyph",
  },
  youtube: {
    name: "YouTube",
    domain: "youtube.com",
    primary: "#ff0000",
    kind: "platform",
    logo: "/images/vendors/youtube.svg",
    shape: "glyph",
  },
  instagram: {
    name: "Instagram",
    domain: "instagram.com",
    primary: "#ff0069",
    kind: "platform",
    logo: "/images/vendors/instagram.svg",
    shape: "glyph",
  },
  tiktok: {
    name: "TikTok",
    domain: "tiktok.com",
    primary: "#000000",
    kind: "platform",
    logo: "/images/vendors/tiktok.svg",
    shape: "tile",
  },
  slack: {
    name: "Slack",
    domain: "slack.com",
    primary: "#4a154b",
    kind: "platform",
    logo: "/images/vendors/slack.svg",
    shape: "glyph",
  },
  patreon: {
    name: "Patreon",
    domain: "patreon.com",
    primary: "#000000",
    kind: "storefront",
    logo: "/images/vendors/patreon.svg",
    shape: "mono",
  },
  whop: {
    name: "Whop",
    domain: "whop.com",
    primary: "#fc3c0c",
    kind: "storefront",
    logo: "/images/vendors/whop.png",
    shape: "tile",
  },
  winible: {
    name: "Winible",
    domain: "winible.com",
    primary: "#6c47ff",
    kind: "storefront",
    logo: "/images/vendors/winible.svg",
    shape: "glyph",
  },
  dubclub: {
    name: "DubClub",
    domain: "dubclub.win",
    primary: "#5b3df5",
    kind: "storefront",
    logo: "/images/vendors/dubclub.svg",
    shape: "tile",
  },
  zapier: {
    name: "Zapier",
    domain: "zapier.com",
    primary: "#ff4f00",
    kind: "platform",
    logo: "/images/vendors/zapier.svg",
    shape: "glyph",
  },
  pikkit: {
    name: "Pikkit",
    domain: "pikkit.com",
    primary: "#11151b",
    kind: "tracker",
    logo: "/images/vendors/pikkit.svg",
    shape: "tile",
  },
  juicereel: {
    name: "Juice Reel",
    domain: "juicereel.com",
    primary: "#fc540c",
    kind: "tracker",
    logo: "/images/vendors/juicereel.png",
    shape: "tile",
  },
  actionnetwork: {
    name: "Action Network",
    domain: "actionnetwork.com",
    primary: "#0ccc54",
    kind: "tracker",
    logo: "/images/vendors/actionnetwork.png",
    shape: "tile",
  },
  betmma: {
    name: "betmma.tips",
    domain: "betmma.tips",
    primary: "#c62828",
    kind: "tracker",
    monogram: "BM",
  },
  tipstrr: {
    name: "Tipstrr",
    domain: "tipstrr.com",
    primary: "#0c243c",
    kind: "tracker",
    logo: "/images/vendors/tipstrr.png",
    shape: "tile",
  },
  blogabet: {
    name: "Blogabet",
    domain: "blogabet.com",
    primary: "#246c54",
    kind: "tracker",
    logo: "/images/vendors/blogabet.png",
    shape: "tile",
  },
  apple: {
    name: "Apple",
    domain: "apple.com",
    primary: "#000000",
    kind: "platform",
    logo: "/images/vendors/apple.svg",
    shape: "mono",
  },
  android: {
    name: "Android",
    domain: "android.com",
    primary: "#3ddc84",
    kind: "platform",
    logo: "/images/vendors/android.svg",
    shape: "glyph",
  },
} satisfies Record<string, Vendor>;

export type VendorKey = keyof typeof VENDORS;

// The Odds API lists one Betfair Exchange per region; they share the brand.
const ALIASES: Record<string, VendorKey> = {
  betfair_ex_uk: "betfair",
  betfair_ex_eu: "betfair",
  betfair_ex_au: "betfair",
  betfair_sb_uk: "betfair",
};

function isVendorKey(key: string): key is VendorKey {
  return Object.hasOwn(VENDORS, key);
}

export function getVendor(key: string): Vendor | undefined {
  const normalized = key.toLowerCase();
  if (isVendorKey(normalized)) return VENDORS[normalized];
  const alias = ALIASES[normalized];
  return alias ? VENDORS[alias] : undefined;
}

export function vendorName(key: string) {
  return getVendor(key)?.name ?? key;
}

export function vendorMonogram(key: string) {
  const vendor = getVendor(key);
  if (vendor?.monogram) return vendor.monogram;
  const name = vendor?.name ?? key;
  const words = name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/);
  const initials =
    words.length > 1 ? words.map((w) => w[0]).join("") : words[0].slice(0, 2);
  return initials.slice(0, 3).toUpperCase();
}
