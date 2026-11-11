import {
  DATA_TABLE_IDS,
  type DataTableId,
  type DataTableStore,
  type DataTableStores,
} from "@/lib/types/data-table";
import { isRecord } from "@/lib/utils/base";

export const initialTableStore = (
  overrides?: Partial<DataTableStore>,
): DataTableStore => ({
  globalFilter: undefined,
  rowSelection: {},
  columnVisibility: {},
  columnFilters: [],
  sorting: [],
  pagination: { pageIndex: 0, pageSize: 10 },
  ...overrides,
});

function isTableId(v: string): v is DataTableId {
  return DATA_TABLE_IDS.some((id) => id === v);
}

function isTableStore(v: unknown): v is DataTableStore {
  if (!isRecord(v)) return false;
  const pagination = v.pagination;
  return (
    isRecord(v.rowSelection) &&
    isRecord(v.columnVisibility) &&
    Array.isArray(v.columnFilters) &&
    Array.isArray(v.sorting) &&
    isRecord(pagination) &&
    typeof pagination.pageIndex === "number" &&
    typeof pagination.pageSize === "number"
  );
}

// The cookie is client written, so a stale or edited one is dropped, not trusted.
export function parseDataTableStores(
  value: unknown,
): DataTableStores | undefined {
  if (!isRecord(value)) return undefined;
  const out: DataTableStores = {};
  for (const entry of Object.entries(value)) {
    const store = entry[1];
    if (!isTableStore(store)) return undefined;
    if (isTableId(entry[0])) out[entry[0]] = store;
  }
  return out;
}
