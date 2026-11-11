export const DATA_TABLE_IDS = ["VALUE_BETS", "PROOF_LEDGER", "BOOKMAKERS"] as const;

export type DataTableId = (typeof DATA_TABLE_IDS)[number];

export type DataTableStore = {
  globalFilter?: string;
  rowSelection: Record<string, true>;
  columnVisibility: Record<string, boolean>;
  columnFilters: { id: string; value: unknown }[];
  sorting: { id: string; desc: boolean }[];
  pagination: { pageIndex: number; pageSize: number };
};

export type DataTableStores = Partial<Record<DataTableId, DataTableStore>>;
