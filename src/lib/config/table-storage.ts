import type { DataTableStore } from "@/lib/api/typebox/data-table";

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
