import { getDb } from "@/lib/db/server/client";
import { pickSources } from "@/lib/db/schema/server";
import type { ApiEvent } from "@/lib/types";
import { dayjs, type Dayjs } from "@/lib/utils/format/date";
import { formatLine } from "@/server/odds/odds.service";
import { createPick } from "@/server/picks/picks.service";
import {
  createCycle,
  emptyReport,
  findEvent,
  SOURCE_MAX_AGE_HOURS,
  teamMatches,
  toUnits,
  type ImportCycle,
  type ImportReport,
} from "@/server/importers/import.shared";
import {
  fetchTopLevelComments,
  findPotdThreads,
  type RedditComment,
} from "@/server/importers/reddit/reddit.api";
import {
  parsePotd,
  type ParsedPotd,
} from "@/server/importers/reddit/reddit.parser";
import { and, eq, inArray } from "drizzle-orm";

const THREAD_MAX_AGE_HOURS = 36;

async function matchEvent(
  cycle: ImportCycle,
  parsed: ParsedPotd,
): Promise<{ sportKey: string; event: ApiEvent } | null> {
  const found: { sportKey: string; event: ApiEvent }[] = [];
  for (const sportKey of parsed.sportKeys) {
    const event = await findEvent(cycle, {
      sportKey,
      teams: parsed.teams,
      start: null,
    });
    if (event) found.push({ sportKey, event });
  }
  return found.length === 1 ? found[0] : null;
}

function selectionFor(parsed: ParsedPotd, event: ApiEvent): string | null {
  if (parsed.market === "totals")
    return formatLine(parsed.side, parsed.point ?? undefined);
  const team = [event.home, event.away].find((t) =>
    teamMatches(parsed.side, t),
  );
  if (!team) return null;
  return parsed.market === "spreads"
    ? formatLine(team, parsed.point ?? undefined)
    : team;
}

async function importComment(
  cycle: ImportCycle,
  comment: RedditComment,
): Promise<ImportReport["created"][number] | string> {
  const parsed = parsePotd(comment.body);
  if (typeof parsed === "string") return parsed;
  if (!cycle.hasBudget()) return "odds credit budget used up";
  const match = await matchEvent(cycle, parsed);
  if (!match) return "no unique Odds API event";
  if (!dayjs(comment.createdAt).isBefore(match.event.commenceTime))
    return "posted after the start";
  const selection = selectionFor(parsed, match.event);
  if (!selection) return "selection not on the event";
  if (!cycle.canSpend(match.sportKey, match.event.id))
    return "odds credit budget used up";

  return createPick({
    identity: {
      kind: "source",
      platform: "reddit",
      handle: comment.author,
      displayName: comment.author,
      url: `https://www.reddit.com/user/${encodeURIComponent(comment.author)}`,
    },
    guildId: null,
    sportKey: match.sportKey,
    eventId: match.event.id,
    market: parsed.market,
    selection,
    units: toUnits(parsed.units),
    loadOdds: cycle.loadOdds,
    source: {
      platform: "reddit",
      externalId: comment.id,
      url: `https://www.reddit.com${comment.permalink}`,
      postedAt: comment.createdAt,
      rawText: comment.body.slice(0, 4000),
      marketRef: null,
      outcomeIndex: null,
    },
  });
}

// r/sportsbook Pick of the Day: one pick per top level comment, priced by the Odds API at import, never by the post.
export async function importReddit(
  options: { now?: Dayjs } = {},
): Promise<ImportReport> {
  const now = options.now ?? dayjs();
  const report = emptyReport();
  const cycle = createCycle(report);
  const threads = (await findPotdThreads()).filter((post) =>
    dayjs
      .unix(post.created_utc)
      .isAfter(now.subtract(THREAD_MAX_AGE_HOURS, "hour")),
  );

  const freshFrom = now.subtract(SOURCE_MAX_AGE_HOURS, "hour");
  const comments: RedditComment[] = [];
  for (const thread of threads)
    comments.push(
      ...(await fetchTopLevelComments(thread.id)).filter((c) =>
        dayjs(c.createdAt).isAfter(freshFrom),
      ),
    );
  if (comments.length === 0) return report;

  const done = new Set(
    (
      await getDb()
        .select({ externalId: pickSources.externalId })
        .from(pickSources)
        .where(
          and(
            eq(pickSources.platform, "reddit"),
            inArray(
              pickSources.externalId,
              comments.map((c) => c.id),
            ),
          ),
        )
    ).map((r) => r.externalId),
  );

  for (const comment of comments.filter((c) => !done.has(c.id))) {
    const ref = `${comment.author} ${comment.id}`;
    try {
      const result = await importComment(cycle, comment);
      if (typeof result === "string")
        report.skipped.push({ ref, reason: result });
      else report.created.push(result);
    } catch (error) {
      report.skipped.push({
        ref,
        reason: error instanceof Error ? error.message : "import failed",
      });
    }
  }
  return report;
}
