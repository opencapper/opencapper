import { Value } from "@sinclair/typebox/value";
import { t } from "elysia";

export const DataTableId = t.Union([
  t.Literal("LEADERBOARD"),
  t.Literal("LEADERBOARD_UNRANKED"),
  t.Literal("PROFILE_PICKS"),
  t.Literal("PROFILE_HISTORY"),
  t.Literal("LOG_ANCHORS"),
  t.Literal("ADMIN_USERS"),
  t.Literal("ADMIN_IMPORTS"),
  t.Literal("ADMIN_PICKS"),
]);
export type DataTableId = typeof DataTableId.static;

export const DataTableStore = t.Object({
  globalFilter: t.Optional(t.String()),
  rowSelection: t.Record(t.String(), t.Literal(true)),
  columnVisibility: t.Record(t.String(), t.Boolean()),
  columnFilters: t.Array(t.Object({ id: t.String(), value: t.Unknown() })),
  sorting: t.Array(t.Object({ id: t.String(), desc: t.Boolean() })),
  pagination: t.Object({
    pageIndex: t.Integer({ minimum: 0 }),
    pageSize: t.Integer({ minimum: 1 }),
  }),
});
export type DataTableStore = typeof DataTableStore.static;

export const DataTableStores = t.Partial(t.Record(DataTableId, DataTableStore));
export type DataTableStores = typeof DataTableStores.static;

// The cookie is client written, so a stale or edited one is dropped, not trusted.
export function parseDataTableStores(value: unknown) {
  return Value.Check(DataTableStores, value) ? value : undefined;
}
