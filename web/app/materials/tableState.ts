import { listMaterialsInputSchema, type ListMaterialsInput } from '@material-register/shared';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';

// The URL is the only place the table's state lives. Reading it gives the API input
// directly, so a refreshed, bookmarked or shared link always shows the same view.
//   ?q=bearing&status=Active&plant=1&mfr=64&sort=unitPrice&dir=asc&page=2&size=50

export type TableState = ListMaterialsInput;

export const DEFAULT_TABLE_STATE: TableState = listMaterialsInputSchema.parse({});

/** Reads the table state from the URL, using the same schema the API validates with. */
export function parseTableState(params: URLSearchParams): TableState {
  const numberParam = (name: string) => (params.has(name) ? Number(params.get(name)) : undefined);

  const result = listMaterialsInputSchema.safeParse({
    search: params.get('q') ?? undefined,
    types: params.getAll('type'),
    statuses: params.getAll('status'),
    plantIds: params.getAll('plant').map(Number),
    manufacturerIds: params.getAll('mfr').map(Number),
    sortBy: params.get('sort') ?? undefined,
    sortDir: params.get('dir') ?? undefined,
    page: numberParam('page'),
    pageSize: numberParam('size'),
  });

  // A hand-edited or outdated link falls back to the default view instead of an error.
  return result.success ? result.data : DEFAULT_TABLE_STATE;
}

/** Writes the state back to URL parameters. Default values are left out to keep links short. */
export function toSearchParams(state: TableState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.search) params.set('q', state.search);
  for (const type of state.types) params.append('type', type);
  for (const status of state.statuses) params.append('status', status);
  for (const id of state.plantIds) params.append('plant', String(id));
  for (const id of state.manufacturerIds) params.append('mfr', String(id));

  const isDefaultSort =
    state.sortBy === DEFAULT_TABLE_STATE.sortBy && state.sortDir === DEFAULT_TABLE_STATE.sortDir;
  if (!isDefaultSort) {
    params.set('sort', state.sortBy);
    params.set('dir', state.sortDir);
  }

  if (state.page !== DEFAULT_TABLE_STATE.page) params.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_TABLE_STATE.pageSize) params.set('size', String(state.pageSize));

  return params;
}

export function hasSearchOrFilters(state: TableState): boolean {
  return (
    state.search !== '' ||
    state.types.length > 0 ||
    state.statuses.length > 0 ||
    state.plantIds.length > 0 ||
    state.manufacturerIds.length > 0
  );
}

export function useTableState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseTableState(searchParams), [searchParams]);

  /**
   * Applies a change. Every change goes back to page 1 unless it sets the page itself:
   * after a new search or sort, "page 7" would point at unrelated rows or past the end.
   */
  function update(changes: Partial<TableState>) {
    setSearchParams(toSearchParams({ ...state, page: 1, ...changes }));
  }

  /** Clears the search and filters but keeps the sort order and page size. */
  function clearSearchAndFilters() {
    update({ search: '', types: [], statuses: [], plantIds: [], manufacturerIds: [] });
  }

  return { state, update, clearSearchAndFilters };
}
