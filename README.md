# OpenCapper

Verified sports picks. Every pick is timestamped, numbered and locked before the game. The platform captures the odds, records are graded by ROI, and there are no sportsbook affiliate deals.

This repo is the web app and the API (Elysia mounted inside Next.js). The Discord bot lives in `opencapper-bot` and calls this API.

## Stack

Next.js 16, Elysia, next-intl (`en`, `de`), React Query, Drizzle with Postgres, Tailwind 4, bun. Production is a single `next-bun-compile` binary on distroless.

## Development

```bash
cp .env.example .env
bun install
bun dev
```

Migrations run on server start (`src/instrumentation.ts`). After a schema change: `bun db:generate`.

## API

Base `/api`. Errors return a non 2xx status with `{ "error": "message" }`.

| Method | Path                             | Auth                                    | Response           |
| ------ | -------------------------------- | --------------------------------------- | ------------------ |
| GET    | `/ops/health`                    |                                         | health             |
| GET    | `/events?sport=<sportKey>`       |                                         | `ApiEvent[]`       |
| POST   | `/picks`                         | `Authorization: Bearer <BOT_API_TOKEN>` | `ApiPick`          |
| GET    | `/picks/settled?guildId=&since=` | `Authorization: Bearer <BOT_API_TOKEN>` | `ApiSettledPick[]` |
| GET    | `/users/:username/picks`         |                                         | `ApiPick[]`        |
| GET    | `/users/:username/stats`         |                                         | `CapperStats`      |
| GET    | `/recap?guildId=&from=&to=`      |                                         | `RecapResponse`    |

Shapes live in `src/lib/types/index.ts`.

`/picks/settled` returns the guild's picks graded strictly after `since`, oldest first, at most 100.

Grading runs in the server process (`src/server/grading/grading.job.ts`, off with `GRADING_ENABLED=false`): every 5 minutes it captures the closing price of picks starting within 15 minutes (one event odds call per event), and every 30 minutes it grades pending picks that started over 3 hours ago (one scores call per sport, 2 credits). Picks without a result 7 days after the start are voided. Polymarket priced picks are graded from the market resolution on the Gamma API (free) and voided after 14 days unresolved.

Public pick importers (`src/server/importers/`, started from `instrumentation.ts`, every 10 minutes, single flight) fill unclaimed public profiles (`pm_<name>`, `rd_<name>`, `users.source_*`) with picks logged through the normal `createPick` path, so they are sequenced, logged and graded like any other. Each imported pick keeps its original post or trade in `pick_sources` (link, original time, raw text). A source is imported only if it is at most 6 hours old and was posted before the start; the pick is locked at import time and never backdated.

- Polymarket (`IMPORT_POLYMARKET_ENABLED=true`): taker BUY fills of the traders in `traders.ts` on moneyline, spread and total markets of the leagues in `leagues.ts`. One pick per trader, game and market type. 1 unit is the trader's median fill over 30 days, the stake is the summed fills on that side, clamped to 0.5 to 5 units. Moneylines of Odds API leagues are priced by the Odds API while `IMPORT_ODDS_CREDITS_PER_DAY` lasts; every other pick is priced by the fill itself (`1 / price`, bookmaker `polymarket`), verifiable through the Polygonscan link.
- Polymarket on chain history (`IMPORT_POLYMARKET_HISTORY_DAYS`, default 90, 0 disables; only with the Polymarket importer on): once at startup, the same traders' taker BUY fills of the last N days that happened before the game start, on markets that have since resolved, with the same mapping, one pick per game and market type and unit sizing. They are graded by the market resolution and stored in `history_picks`, never in `picks` or the pick log, and shown as "verified on chain, imported later" with a Polygonscan link. Requests are sequential with a short pause; reruns skip what is already stored.
- Reddit r/sportsbook Pick of the Day (all `REDDIT_*` set): top level comments with a moneyline, spread or total on an Odds API event, priced by the Odds API at import. Needs credits.

## Deploy

Komodo stack on the Netcup box: Komodo clones this repo and runs `docker compose build` and `up` with `docker-compose.yml`. Runtime env comes from the stack's `.env` (see `.env.example`).

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
