import { Anchor, Badge, Group, Skeleton, Table, Text, UnstyledButton } from '@mantine/core';
import type { SortDirection, SortField } from '@material-register/shared';
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { STATUS_COLORS } from '../theme.ts';
import type { MaterialRow } from '../trpc.ts';
import { formatDate, formatPrice } from './format.ts';

type Column = {
  label: string;
  /** Present only on columns the API can sort by; the others get a plain header. */
  sortField?: SortField;
  align?: 'right';
};

// One field per column, so a sort arrow always means exactly one field.
const COLUMNS: Column[] = [
  { label: 'Material no.', sortField: 'materialNumber' },
  { label: 'Description', sortField: 'description' },
  { label: 'Type' },
  { label: 'Manufacturer' },
  { label: 'Part no.' },
  { label: 'Plant' },
  { label: 'Status' },
  { label: 'Unit price', sortField: 'unitPrice', align: 'right' },
  { label: 'Stock', sortField: 'quantityOnHand', align: 'right' },
  { label: 'Updated', sortField: 'updatedAt' },
];

// Digits of equal width, so prices and quantities line up down the column.
const NUMERIC = { fontVariantNumeric: 'tabular-nums' } as const;

type HeaderProps = {
  sortBy: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
};

function HeaderRow({ sortBy, sortDir, onSort }: HeaderProps) {
  return (
    <Table.Tr>
      {COLUMNS.map(({ label, sortField, align }) => {
        if (!sortField) {
          return <Table.Th key={label}>{label}</Table.Th>;
        }

        const isSorted = sortBy === sortField;
        const Icon = !isSorted ? IconSelector : sortDir === 'asc' ? IconChevronUp : IconChevronDown;

        return (
          <Table.Th
            key={label}
            ta={align}
            // Tells screen readers which column is sorted and in which direction.
            aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            <UnstyledButton onClick={() => onSort(sortField)} fw={700} fz="sm">
              <Group gap={4} wrap="nowrap">
                {label}
                <Icon size={14} aria-hidden />
              </Group>
            </UnstyledButton>
          </Table.Th>
        );
      })}
    </Table.Tr>
  );
}

/** Passed along with the link to a material, and read by the detail page. */
export type MaterialLinkState = { listSearch: string };

function MaterialRowCells({ material }: { material: MaterialRow }) {
  // The list's query string, for example "?q=bearing&page=2".
  const listSearch = useLocation().search;

  return (
    <Table.Tr>
      <Table.Td>
        {/* A real link, so it works with the keyboard and "open in new tab". The list's
            current URL travels with it, so the detail page can link back to this view. */}
        <Anchor
          component={Link}
          to={`/materials/${material.id}`}
          state={{ listSearch } satisfies MaterialLinkState}
          ff="monospace"
          fz="sm"
        >
          {material.materialNumber}
        </Anchor>
      </Table.Td>
      <Table.Td>{material.description}</Table.Td>
      <Table.Td>{material.materialType}</Table.Td>
      {/* Raw materials have no manufacturer or part number. */}
      <Table.Td>{material.manufacturer?.name ?? '-'}</Table.Td>
      <Table.Td>
        <Text ff="monospace" fz="sm">
          {material.manufacturerPartNumber ?? '-'}
        </Text>
      </Table.Td>
      <Table.Td>
        {material.plant.code} · {material.plant.name}
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={STATUS_COLORS[material.status]}>
          {material.status}
        </Badge>
      </Table.Td>
      <Table.Td ta="right" style={NUMERIC}>
        {formatPrice(material.unitPrice)}
      </Table.Td>
      <Table.Td ta="right" style={NUMERIC}>
        {material.quantityOnHand} {material.unitOfMeasure}
      </Table.Td>
      <Table.Td>{formatDate(material.updatedAt)}</Table.Td>
    </Table.Tr>
  );
}

type MaterialsTableProps = HeaderProps & {
  /** Undefined on the very first load, before any rows have arrived. */
  materials: MaterialRow[] | undefined;
  /** True while a new page or filter is loading and the previous rows are still shown. */
  isRefreshing: boolean;
  skeletonRows: number;
};

export function MaterialsTable({
  materials,
  isRefreshing,
  skeletonRows,
  ...header
}: MaterialsTableProps) {
  return (
    // On a narrow screen the table scrolls sideways instead of squeezing its columns.
    <Table.ScrollContainer minWidth={1100}>
      <Table
        striped
        highlightOnHover
        verticalSpacing="xs"
        aria-busy={isRefreshing || !materials}
        // Old rows stay visible but faded while new ones load, which avoids the table
        // collapsing and jumping on every page change.
        opacity={isRefreshing ? 0.5 : 1}
      >
        <Table.Thead>
          <HeaderRow {...header} />
        </Table.Thead>
        <Table.Tbody>
          {materials
            ? materials.map((material) => (
                <MaterialRowCells key={material.id} material={material} />
              ))
            : Array.from({ length: skeletonRows }, (_, row) => (
                <Table.Tr key={row}>
                  {COLUMNS.map(({ label }) => (
                    <Table.Td key={label}>
                      <Skeleton height={16} />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
