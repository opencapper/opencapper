import {
  type DataTableId,
  type DataTableStore,
  type DataTableStores,
  parseDataTableStores,
} from "@/lib/api/typebox/data-table";
import { jotaiCookieStorage } from "@/lib/config/cookie-storage";
import { DATA_TABLES_COOKIE } from "@/lib/config/constants";
import { initialTableStore } from "@/lib/config/table-storage";
import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  ColumnVisibilityState,
} from "@tanstack/react-table";
import type { WritableAtom } from "jotai";
import { atom } from "jotai";
import { atomFamily } from "jotai-family";
import { atomWithStorage } from "jotai/utils";

// Flipped by DataTableProvider once the server-read cookie state is in the
// store. Query hooks whose params derive from table filters gate on this:
// before it, a render sees default filters and would fire a throwaway request
// pair that the real filters immediately supersede.
export const tablesHydratedAtom = atom(false);

const tableCookieStorage = {
  getItem: (key: string, initial: DataTableStores): DataTableStores =>
    parseDataTableStores(jotaiCookieStorage.getItem<unknown>(key, initial)) ??
    initial,
  setItem: jotaiCookieStorage.setItem,
  removeItem: jotaiCookieStorage.removeItem,
};

export const dataTableStorageAtom = atomWithStorage<DataTableStores>(
  DATA_TABLES_COOKIE,
  {},
  tableCookieStorage,
);

const dataTableAtomFamily = atomFamily((id: DataTableId) =>
  atom<
    DataTableStore,
    [Partial<DataTableStore> | ((prev: DataTableStore) => DataTableStore)],
    void
  >(
    (get) => {
      const allTables = get(dataTableStorageAtom);
      return allTables[id] || initialTableStore();
    },
    (get, set, update) => {
      const allTables = get(dataTableStorageAtom);
      const current = allTables[id] || initialTableStore();
      const newState =
        typeof update === "function"
          ? update(current)
          : { ...current, ...update };
      set(dataTableStorageAtom, { ...allTables, [id]: newState });
    },
  ),
);

type TableUpdate =
  Partial<DataTableStore> | ((prev: DataTableStore) => DataTableStore);
type BaseAtom = WritableAtom<DataTableStore, [TableUpdate], void>;

function buildFieldAtoms(
  base: BaseAtom,
  initialValues?: Partial<DataTableStore>,
) {
  function fieldAtom<T>(
    selector: (s: DataTableStore) => T,
    updater: (prev: DataTableStore, value: T) => DataTableStore,
  ) {
    return atom(
      (get) => selector(get(base)),
      (_get, set, updaterOrValue: T | ((prev: T) => T)) => {
        set(base, (prev) => {
          const resolved =
            updaterOrValue instanceof Function
              ? updaterOrValue(selector(prev))
              : updaterOrValue;
          return updater(prev, resolved);
        });
      },
    );
  }

  return {
    baseAtom: base,
    globalFilterAtom: fieldAtom<string | undefined>(
      (s) => s.globalFilter,
      (prev, v) => ({
        ...prev,
        globalFilter: v,
        pagination: { ...prev.pagination, pageIndex: 0 },
      }),
    ),
    rowSelectionAtom: fieldAtom<RowSelectionState>(
      (s) => s.rowSelection,
      (prev, v) => ({ ...prev, rowSelection: v }),
    ),
    columnVisibilityAtom: fieldAtom<ColumnVisibilityState>(
      (s) => s.columnVisibility,
      (prev, v) => ({ ...prev, columnVisibility: v }),
    ),
    columnFiltersAtom: fieldAtom<ColumnFiltersState>(
      (s) => s.columnFilters,
      (prev, v) => ({ ...prev, columnFilters: v }),
    ),
    sortingAtom: fieldAtom<SortingState>(
      (s) => s.sorting,
      (prev, v) => ({ ...prev, sorting: v }),
    ),
    paginationAtom: fieldAtom<PaginationState>(
      (s) => s.pagination,
      (prev, v) => ({ ...prev, pagination: v }),
    ),
    resetTableAtom: atom(null, (_get, set) =>
      set(base, initialTableStore(initialValues)),
    ),
  };
}

export const createTableAtoms = (
  id: DataTableId,
  initialValues?: Partial<DataTableStore>,
) => buildFieldAtoms(dataTableAtomFamily(id), initialValues);
