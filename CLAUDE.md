> **Scope:** rules and traps invisible at the call site. Product plan: `../research/odds-product/plan.md`.

OpenEV web: a view only. Next.js 16 renders what `../openev-api` (Rust) serves; there is no database, auth logic or business logic here. Odds math, matching, value bets, users and alerts all live in the API.

## Rules

- bun for everything. No tests unless asked. `bun run typecheck` is the gate.
- No dashes as punctuation, no emojis, anywhere (UI text included).
- Comments only for a non obvious why, one terse line.
- React 19: no `useMemo` or `useCallback`, no destructuring hook returns.
- API types are generated, never written by hand: run `bun run api:types` against a running API (default `http://127.0.0.1:8085`) after any API change, and commit `src/lib/api/schema.d.ts`.
- Call the API only through `api` in `src/lib/api/client.ts`, server side. `OPENEV_API_URL` points at the internal API (`http://openev-api:8080` in production); the API is never exposed through Traefik.

## Deploy

- Netcup, `docker compose up -d --build` in the server directory, Traefik host `openev.coding-global.com` on the external `proxy` network. The API stack (`openev-api`) must be up on the same network.
