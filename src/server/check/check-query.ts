import { slugifyUsername } from "@/server/users/identity.service";

export type CheckLookup = {
  term: string;
  numericId: string | null;
  usernames: string[];
  handles: string[];
};

const NUMERIC_ID = /^[0-9]{5,21}$/;
const DISCORD_MENTION = /^<@!?([0-9]{15,21})>$/;
const HAS_HOST = /^(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\//i;

// The last meaningful path segment of a pasted profile link (OpenCapper, Discord, Telegram, Polymarket, Reddit).
function fromUrl(text: string): string {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return text;
  }
  const parts = url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  const marker = parts.findIndex((part) =>
    ["u", "user", "users", "profile"].includes(part.toLowerCase()),
  );
  if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
  return parts.at(-1) ?? text;
}

export function parseCheckQuery(raw: string): CheckLookup {
  let term = raw.trim();
  const mention = DISCORD_MENTION.exec(term);
  if (mention) term = mention[1];
  else if (HAS_HOST.test(term)) term = fromUrl(term);
  term = term.replace(/^(?:\/?u\/|@)+/i, "").trim();

  const lower = term.toLowerCase();
  const slug = slugifyUsername(term);
  const names = new Set<string>();
  if (lower.length >= 2) names.add(lower);
  if (slug.length >= 2) {
    names.add(slug);
    names.add(`pm_${slug}`.slice(0, 32));
    names.add(`rd_${slug}`.slice(0, 32));
  }
  return {
    term,
    numericId: NUMERIC_ID.test(term) ? term : null,
    usernames: [...names],
    // Source handles are stored lowercased: Polymarket wallets and Reddit names.
    handles: lower.length >= 2 ? [lower] : [],
  };
}
