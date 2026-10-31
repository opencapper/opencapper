// One off repair of picks graded before the result guard: dry run by default, `--apply` writes.
// bun scripts/repair-grading.ts [--apply] [--extra <pickId>=<actualStartIso>=<evidence url>]...
import {
  pickDisqualifications,
  pickSources,
  picks,
} from "@/lib/db/schema/server";
import { EXCHANGE_BOOKMAKER } from "@/lib/api/typebox/sources";
import { dayjs } from "@/lib/utils/format/date";
import {
  correctResult,
  disqualifyPick,
} from "@/server/grading/grading.service";
import {
  fetchMarkets,
  marketStart,
  resolveOutcome,
  type PolymarketMarket,
} from "@/server/polymarket/polymarket.api";
import { and, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const ACTOR = "repair-grading";
const apply = process.argv.includes("--apply");
const extras = process.argv.flatMap((arg, i) => {
  if (process.argv[i - 1] !== "--extra") return [];
  const [id, start, ...url] = arg.split("=");
  const pickId = Number(id);
  const actualStart = dayjs(start);
  if (!Number.isInteger(pickId) || !actualStart.isValid())
    throw new Error(`bad --extra ${arg}`);
  return [{ pickId, actualStart: actualStart.toDate(), url: url.join("=") }];
});

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
// Reads never write, whatever the flag: the writes below go through the app's own guarded paths.
const read = drizzle(
  postgres(url, {
    max: 1,
    onnotice: () => {},
    connection: { default_transaction_read_only: true },
  }),
);

// Before migration 0018 the table is missing and nothing is disqualified yet.
const migrated = await read.execute<{ found: string | null }>(
  sql`select to_regclass('pick_disqualifications')::text as found`,
);
const base = read

  .select({
    id: picks.id,
    result: picks.result,
    commenceTime: picks.commenceTime,
    createdAt: picks.createdAt,
    filledAt: pickSources.postedAt,
    marketRef: pickSources.marketRef,
    outcomeIndex: pickSources.outcomeIndex,
  })
  .from(picks)
  .innerJoin(pickSources, eq(pickSources.pickId, picks.id));
const rows = migrated[0]?.found
  ? await base
      .leftJoin(
        pickDisqualifications,
        eq(pickDisqualifications.pickId, picks.id),
      )
      .where(
        and(
          eq(picks.bookmaker, EXCHANGE_BOOKMAKER),
          isNull(pickDisqualifications.pickId),
        ),
      )
  : await base.where(eq(picks.bookmaker, EXCHANGE_BOOKMAKER));

const refs = rows.flatMap((row) => (row.marketRef ? [row.marketRef] : []));
const markets = new Map<string, PolymarketMarket>();
for (const closed of [true, false])
  for (const market of await fetchMarkets(refs, closed, 300))
    markets.set(market.conditionId, market);

const late = rows.flatMap((row) => {
  const market = row.marketRef ? markets.get(row.marketRef) : undefined;
  const start = market ? marketStart(market) : null;
  const lockedAt = row.filledAt > row.createdAt ? row.filledAt : row.createdAt;
  return start && !dayjs(lockedAt).isBefore(start)
    ? [{ row, start, slug: market?.events?.[0]?.slug ?? market?.slug ?? "" }]
    : [];
});

const splits = rows.flatMap((row) => {
  const market = row.marketRef ? markets.get(row.marketRef) : undefined;
  return market &&
    row.result === "void" &&
    row.outcomeIndex !== null &&
    resolveOutcome(market, row.outcomeIndex) === "split"
    ? [{ row, slug: market.slug }]
    : [];
});

console.log(apply ? "APPLY" : "DRY RUN");
console.log(
  `\npicks locked at or after the current Polymarket start (${late.length}):`,
);
for (const entry of late)
  console.log(
    `  pick ${entry.row.id} ${entry.row.result}: stored ${dayjs(entry.row.commenceTime).toISOString()}, gamma now ${dayjs(entry.start).toISOString()}, fill ${dayjs(entry.row.filledAt).toISOString()}, created ${dayjs(entry.row.createdAt).toISOString()} (${entry.slug})`,
  );
console.log(`\npicks with an outside start source (${extras.length}):`);
for (const extra of extras)
  console.log(
    `  pick ${extra.pickId}: actual start ${dayjs(extra.actualStart).toISOString()} (${extra.url})`,
  );
console.log(
  `\nPolymarket 50/50 resolutions stored as void (${splits.length}):`,
);
for (const entry of splits)
  console.log(`  pick ${entry.row.id}: void to split (${entry.slug})`);

if (apply) {
  for (const entry of late)
    await disqualifyPick({
      pickId: entry.row.id,
      actualStart: entry.start,
      detectedBy: "repair",
      evidence: {
        source: "polymarket gamma",
        polymarketEvent: entry.slug,
        storedCommence: dayjs(entry.row.commenceTime).toISOString(),
        fillAt: dayjs(entry.row.filledAt).toISOString(),
        createdAt: dayjs(entry.row.createdAt).toISOString(),
      },
    });
  for (const extra of extras)
    await disqualifyPick({
      pickId: extra.pickId,
      actualStart: extra.actualStart,
      detectedBy: "repair",
      evidence: { source: extra.url },
    });
  for (const entry of splits)
    await correctResult({
      pickId: entry.row.id,
      to: "split",
      reason: "Polymarket resolved the market 50/50, paying 0.5 per share",
      actor: ACTOR,
    });
  console.log("\napplied");
}
process.exit(0);
