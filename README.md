# openev

Web view for OpenEV: value bets from UK bookmakers priced against the sharp fair line. Data comes from the private `openev-api` service.

```bash
bun install
OPENEV_API_URL=http://127.0.0.1:8085 bun run dev
bun run api:types   # regenerate API types from the running API
```
