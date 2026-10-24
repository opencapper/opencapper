import type { VerifyTarget } from "@/hooks/log/log-hook";

export type SearchTarget = VerifyTarget | { kind: "capper"; username: string };

const PICK_ID = /^\d{1,9}$/;
const NAME = "@?([A-Za-z0-9_.]{2,32})";
const USER_SEQ = new RegExp(`^${NAME}\\s*[#/\\s]\\s*(\\d{1,9})$`);
const USERNAME = new RegExp(`^${NAME}$`);
const PROFILE_PATH = /^\/(?:[a-z]{2}\/)?u\/([^/]+)\/?$/;

function fromParams(params: URLSearchParams): SearchTarget | null {
  const pick = params.get("pick")?.trim() ?? "";
  if (PICK_ID.test(pick)) return { kind: "pick", pickId: Number(pick) };
  const user = params.get("user")?.trim() ?? "";
  const seq = params.get("seq")?.trim() ?? "";
  if (!USERNAME.test(user)) return null;
  if (PICK_ID.test(seq))
    return { kind: "user", username: user.replace(/^@/, ""), seq: Number(seq) };
  return { kind: "capper", username: user.replace(/^@/, "") };
}

function fromUrl(text: string): SearchTarget | null {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  const query = fromParams(url.searchParams);
  if (query) return query;
  const profile = PROFILE_PATH.exec(url.pathname);
  if (!profile) return null;
  return { kind: "capper", username: decodeURIComponent(profile[1]) };
}

export function parseSearch(text: string): SearchTarget | null {
  const value = text.trim();
  if (PICK_ID.test(value)) return { kind: "pick", pickId: Number(value) };
  if (/^https?:\/\//i.test(value)) return fromUrl(value);
  const seq = USER_SEQ.exec(value);
  if (seq) return { kind: "user", username: seq[1], seq: Number(seq[2]) };
  const name = USERNAME.exec(value);
  return name ? { kind: "capper", username: name[1] } : null;
}

export function searchQuery(target: SearchTarget): string {
  if (target.kind === "pick") return `?pick=${target.pickId}`;
  const user = `?user=${encodeURIComponent(target.username)}`;
  return target.kind === "user" ? `${user}&seq=${target.seq}` : user;
}
