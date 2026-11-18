import { Alert, Anchor, Button, Group, Stack, Text } from '@mantine/core';
import type { SortField } from '@material-register/shared';
import { IconAlertTriangle, IconSearchOff } from '@tabler/icons-react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Filters } from '../materials/Filters.tsx';
import { formatCount } from '../materials/format.ts';
import { MaterialsTable } from '../materials/MaterialsTable.tsx';
import { SearchBox } from '../materials/SearchBox.tsx';
import { TableFooter } from '../materials/TableFooter.tsx';
import { hasSearchOrFilters, useTableState } from '../materials/tableState.ts';
import { useTRPC } from '../trpc.ts';

export function meta() {
  return [{ title: 'Material register' }];
}

export default function MaterialsPage() {
  const trpc = useTRPC();
  const { state, update, clearSearchAndFilters } = useTableState();

  // The URL state is the query input. When it changes, the query key changes and a new
  // request is made; keepPreviousData leaves the old rows on screen until it arrives.
  const list = useQuery(
    trpc.materials.list.queryOptions(state, { placeholderData: keepPreviousData }),
  );
  // Plants and manufacturers do not change while the page is open.
  const options = useQuery(trpc.meta.options.queryOptions(undefined, { staleTime: Infinity }));

  const filtered = hasSearchOrFilters(state);

  /** A new column starts ascending; clicking the sorted column again reverses it. */
  function handleSort(field: SortField) {
    const sortDir = state.sortBy === field && state.sortDir === 'asc' ? 'desc' : 'asc';
    update({ sortBy: field, sortDir });
  }

  /** Retries the list, and the filter choices too if they failed in the same outage. */
  function retry() {
    void list.refetch();
    if (options.isError) void options.refetch();
  }

  return (
    <Stack gap="md">
      <SearchBox
        key={state.search}
        value={state.search}
        onSearch={(search) => update({ search })}
      />
      <Filters
        state={state}
        options={options.data}
        optionsFailed={options.isError}
        onChange={update}
      />

      <Group gap="md" mih={24}>
        {/* aria-live: a screen reader announces the new count after each search. */}
        <Text c="dimmed" fz="sm" aria-live="polite">
          {list.data
            ? `${formatCount(list.data.total)} ${list.data.total === 1 ? 'material' : 'materials'}`
            : ' '}
        </Text>
        {filtered && (
          <Anchor component="button" type="button" fz="sm" onClick={clearSearchAndFilters}>
            Clear search and filters
          </Anchor>
        )}
      </Group>

      {list.isError ? (
        <Alert color="red" icon={<IconAlertTriangle aria-hidden />} title="Couldn't load materials">
          <Stack gap="sm" align="flex-start">
            <Text fz="sm">Check your connection and try again.</Text>
            <Button variant="default" size="xs" onClick={retry}>
              Retry
            </Button>
          </Stack>
        </Alert>
      ) : list.data?.total === 0 ? (
        <Stack align="center" gap="xs" py="xl">
          <IconSearchOff size={32} aria-hidden />
          <Text fw={600}>No materials match</Text>
          <Text c="dimmed" fz="sm">
            Try fewer filters or a shorter search.
          </Text>
          {filtered && (
            <Button variant="default" onClick={clearSearchAndFilters}>
              Clear search and filters
            </Button>
          )}
        </Stack>
      ) : list.data && list.data.items.length === 0 ? (
        // Reached by a link to a page that no longer exists, for example after the
        // data shrank. The API still reports the real page count.
        <Stack align="center" gap="xs" py="xl">
          <Text fw={600}>This page is past the last one</Text>
          <Button variant="default" onClick={() => update({ page: list.data.pageCount })}>
            Go to the last page
          </Button>
        </Stack>
      ) : (
        <>
          <MaterialsTable
            materials={list.data?.items}
            isRefreshing={list.isPlaceholderData}
            skeletonRows={state.pageSize}
            sortBy={state.sortBy}
            sortDir={state.sortDir}
            onSort={handleSort}
          />
          {list.data && (
            <TableFooter
              page={list.data.page}
              pageSize={list.data.pageSize}
              pageCount={list.data.pageCount}
              total={list.data.total}
              onPageChange={(page) => update({ page })}
              onPageSizeChange={(pageSize) => update({ pageSize })}
            />
          )}
        </>
      )}
    </Stack>
  );
}
