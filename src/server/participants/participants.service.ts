import { dayjs } from "@/lib/utils/format/date";
import { getDb } from "@/lib/db/server/client";
import { participants } from "@/lib/db/schema/server";
import type { ParticipantKind } from "@/lib/api/typebox/participants";
import {
  isFighterGroup,
  sportGroup,
  type SportGroup,
} from "@/lib/config/sports";
import { THESPORTSDB_BASE } from "@/server/constants";
import { serverEnv } from "@/server/env";
import { Type, type TSchema, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { and, eq, inArray } from "drizzle-orm";

export type ResolvedParticipant = {
  imageUrl: string | null;
  kind: ParticipantKind;
  country: string | null;
};

export type ParticipantImages = Map<string, ResolvedParticipant>;

export type ParticipantFields = {
  homeImage: string | null;
  awayImage: string | null;
  homeCountry: string | null;
  awayCountry: string | null;
};

const TSDB_SPORT = {
  americanfootball: "American Football",
  basketball: "Basketball",
  baseball: "Baseball",
  icehockey: "Ice Hockey",
  soccer: "Soccer",
  cricket: "Cricket",
  aussierules: "Australian Football",
  rugby: "Rugby",
  mma: "Fighting",
  boxing: "Fighting",
} satisfies Partial<Record<SportGroup, string>>;

type LookupGroup = keyof typeof TSDB_SPORT;

// TheSportsDB files MMA and boxing both under "Fighting"; the division name tells them apart.
const FIGHTER_HINTS: Partial<Record<LookupGroup, string[]>> = {
  mma: ["ufc", "mma", "bellator", "pfl"],
  boxing: ["boxing"],
};

const HIT_TTL_DAYS = 30;
const MISS_TTL_DAYS = 7;
// Measured: the free key answers 429 after 12 to 15 searches a minute and then locks out for about 100 seconds.
const MIN_GAP_MS = 6_000;
const MAX_ATTEMPTS = 3;
const MAX_QUEUED = 100;

const NullableString = Type.Optional(Type.Union([Type.String(), Type.Null()]));

const TeamsSchema = Type.Object({
  teams: Type.Union([
    Type.Array(
      Type.Object({
        strTeam: Type.String(),
        strSport: NullableString,
        strLeague: NullableString,
        strLeague2: NullableString,
        strLeague3: NullableString,
        strBadge: NullableString,
      }),
    ),
    Type.Null(),
  ]),
});

const PlayersSchema = Type.Object({
  player: Type.Union([
    Type.Array(
      Type.Object({
        strPlayer: Type.String(),
        strSport: NullableString,
        strTeam: NullableString,
        strThumb: NullableString,
        strCutout: NullableString,
        strNationality: NullableString,
      }),
    ),
    Type.Null(),
  ]),
});

function isLookupGroup(group: SportGroup | null): group is LookupGroup {
  return group !== null && group in TSDB_SPORT;
}

function kindOf(group: LookupGroup): ParticipantKind {
  return isFighterGroup(group) ? "fighter" : "team";
}

function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function participantKey(sportKey: string, name: string): string {
  return `${sportGroup(sportKey) ?? sportKey}:${name}`;
}

let nextSlotAt = 0;

function pauseUntil(at: number) {
  nextSlotAt = Math.max(nextSlotAt, at);
}

async function takeSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlotAt);
  nextSlotAt = at + MIN_GAP_MS;
  if (at > now) await new Promise((resolve) => setTimeout(resolve, at - now));
}

async function sportsDb<T extends TSchema>(
  endpoint: "searchteams.php" | "searchplayers.php",
  name: string,
  schema: T,
): Promise<Static<T>> {
  const url = new URL(
    `${THESPORTSDB_BASE}/${encodeURIComponent(serverEnv.theSportsDbApiKey)}/${endpoint}`,
  );
  url.searchParams.set(
    endpoint === "searchteams.php" ? "t" : "p",
    name.replaceAll(" ", "_"),
  );
  let res: Response | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await takeSlot();
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (res.status !== 429) break;
    const wait = Number(res.headers.get("retry-after"));
    pauseUntil(
      Date.now() + (Number.isFinite(wait) && wait > 0 ? wait : 100) * 1000,
    );
  }
  if (!res?.ok) throw new Error(`TheSportsDB responded ${res?.status}`);
  const body: unknown = await res.json();
  if (!Value.Check(schema, body))
    throw new Error("TheSportsDB returned an unexpected response");
  return body;
}

function score(input: {
  name: string;
  candidate: string;
  sport: string | null | undefined;
  wantSport: string;
  context: (string | null | undefined)[];
  hints: string[];
}): number {
  if (input.sport !== input.wantSport) return -1;
  const context = normalise(input.context.filter(Boolean).join(" "));
  const hinted = input.hints.some((hint) => context.includes(hint));
  const exact = normalise(input.candidate) === normalise(input.name);
  return (hinted ? 2 : 0) + (exact ? 1 : 0);
}

function best<T>(items: T[], scoreOf: (item: T) => number): T | null {
  let winner: T | null = null;
  let top = -1;
  for (const item of items) {
    const value = scoreOf(item);
    if (value > top) {
      top = value;
      winner = item;
    }
  }
  return winner;
}

async function fetchParticipant(
  group: LookupGroup,
  sportKey: string,
  name: string,
): Promise<ResolvedParticipant> {
  const kind = kindOf(group);
  const wantSport = TSDB_SPORT[group];

  if (kind === "fighter") {
    const body = await sportsDb("searchplayers.php", name, PlayersSchema);
    const match = best(body.player ?? [], (player) =>
      score({
        name,
        candidate: player.strPlayer,
        sport: player.strSport,
        wantSport,
        context: [player.strTeam],
        hints: FIGHTER_HINTS[group] ?? [],
      }),
    );
    return {
      kind,
      imageUrl: match?.strThumb || match?.strCutout || null,
      country: match?.strNationality || null,
    };
  }

  const body = await sportsDb("searchteams.php", name, TeamsSchema);
  const match = best(body.teams ?? [], (team) =>
    score({
      name,
      candidate: team.strTeam,
      sport: team.strSport,
      wantSport,
      context: [team.strLeague, team.strLeague2, team.strLeague3],
      hints: sportKey.split("_").slice(1),
    }),
  );
  return { kind, imageUrl: match?.strBadge || null, country: null };
}

function isFresh(row: { imageUrl: string | null; fetchedAt: Date }): boolean {
  const ttl = row.imageUrl ? HIT_TTL_DAYS : MISS_TTL_DAYS;
  return dayjs(row.fetchedAt).add(ttl, "day").isAfter(dayjs());
}

const inflight = new Map<string, Promise<ResolvedParticipant>>();

// A failed request stays uncached so it retries; an empty result is cached as a miss.
function refresh(
  group: LookupGroup,
  sportKey: string,
  name: string,
): Promise<ResolvedParticipant> {
  const key = `${group}:${name}`;
  const pending = inflight.get(key);
  if (pending) return pending;

  const task = fetchParticipant(group, sportKey, name)
    .then(async (resolved) => {
      const values = { ...resolved, fetchedAt: dayjs().toDate() };
      await getDb()
        .insert(participants)
        .values({ sportGroup: group, name, ...values })
        .onConflictDoUpdate({
          target: [participants.sportGroup, participants.name],
          set: values,
        });
      return resolved;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, task);
  return task;
}

export async function resolveParticipant(
  name: string,
  sportKey: string,
): Promise<ResolvedParticipant | null> {
  const group = sportGroup(sportKey);
  if (!isLookupGroup(group)) return null;
  const [row] = await getDb()
    .select()
    .from(participants)
    .where(
      and(eq(participants.sportGroup, group), eq(participants.name, name)),
    );
  if (row && isFresh(row))
    return { imageUrl: row.imageUrl, kind: row.kind, country: row.country };
  return refresh(group, sportKey, name);
}

// Returns cached rows only and refreshes misses in the background, so callers never wait on TheSportsDB.
export async function lookupParticipants(
  items: { sportKey: string; name: string }[],
): Promise<ParticipantImages> {
  const images: ParticipantImages = new Map();
  const wanted = new Map<
    string,
    { group: LookupGroup; sportKey: string; name: string }
  >();
  for (const item of items) {
    const group = sportGroup(item.sportKey);
    if (isLookupGroup(group))
      wanted.set(`${group}:${item.name}`, { group, ...item });
  }
  if (wanted.size === 0) return images;

  const entries = [...wanted.values()];
  const rows = await Promise.resolve()
    .then(() =>
      getDb()
        .select()
        .from(participants)
        .where(
          and(
            inArray(participants.sportGroup, [
              ...new Set(entries.map((entry) => entry.group)),
            ]),
            inArray(participants.name, [
              ...new Set(entries.map((entry) => entry.name)),
            ]),
          ),
        ),
    )
    .catch(() => []);

  const cached = new Map(
    rows.map((row) => [`${row.sportGroup}:${row.name}`, row]),
  );
  for (const [key, entry] of wanted) {
    const row = cached.get(key);
    if (row)
      images.set(key, {
        imageUrl: row.imageUrl,
        kind: row.kind,
        country: row.country,
      });
    if ((!row || !isFresh(row)) && inflight.size < MAX_QUEUED)
      refresh(entry.group, entry.sportKey, entry.name).catch(() => {});
  }
  return images;
}

export function isLookupPending(sportKey: string, name: string): boolean {
  return inflight.has(participantKey(sportKey, name));
}

export function participantFields(
  images: ParticipantImages,
  sportKey: string,
  home: string,
  away: string,
): ParticipantFields {
  const homeEntry = images.get(participantKey(sportKey, home));
  const awayEntry = images.get(participantKey(sportKey, away));
  return {
    homeImage: homeEntry?.imageUrl ?? null,
    awayImage: awayEntry?.imageUrl ?? null,
    homeCountry: homeEntry?.country ?? null,
    awayCountry: awayEntry?.country ?? null,
  };
}
