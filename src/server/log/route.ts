import { getAnchorOts, listAnchors } from "@/server/log/anchor.service";
import {
  getLogHead,
  getPickEntry,
  getUserSequenceEntry,
  listEntries,
} from "@/server/log/log.service";
import { Elysia, t } from "elysia";

const EXPORT_LIMIT = 1000;

// Async handlers: see usersRoute.
export const logRoute = new Elysia({ prefix: "/log" })
  .get("/head", () => getLogHead())
  .get("/picks/:id", async (ctx) => getPickEntry(ctx.params.id), {
    params: t.Object({ id: t.Numeric({ minimum: 1, multipleOf: 1 }) }),
  })
  .get(
    "/users/:username/:seq",
    async (ctx) => getUserSequenceEntry(ctx.params.username, ctx.params.seq),
    {
      params: t.Object({
        username: t.String({ minLength: 2, maxLength: 32 }),
        seq: t.Numeric({ minimum: 1, multipleOf: 1 }),
      }),
    },
  )
  .get(
    "/entries",
    (ctx) => listEntries(ctx.query.from ?? 1, ctx.query.limit ?? 100),
    {
      query: t.Object({
        from: t.Optional(t.Numeric({ minimum: 1, multipleOf: 1 })),
        limit: t.Optional(
          t.Numeric({ minimum: 1, maximum: EXPORT_LIMIT, multipleOf: 1 }),
        ),
      }),
    },
  )
  .get("/anchors", () => listAnchors())
  .get(
    "/anchors/:file",
    async (ctx) => getAnchorOts(Number.parseInt(ctx.params.file, 10)),
    { params: t.Object({ file: t.String({ pattern: "^[0-9]{1,9}\\.ots$" }) }) },
  );
