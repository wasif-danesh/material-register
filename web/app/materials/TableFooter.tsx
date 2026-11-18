import { Group, Pagination, Select, Text } from '@mantine/core';
import { PAGE_SIZES } from '@material-register/shared';
import { formatCount } from './format.ts';

type TableFooterProps = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: (typeof PAGE_SIZES)[number]) => void;
};

export function TableFooter({
  page,
  pageSize,
  pageCount,
  total,
  onPageChange,
  onPageSizeChange,
}: TableFooterProps) {
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <Group justify="space-between">
      <Group gap="sm">
        <Select
          aria-label="Rows per page"
          data={PAGE_SIZES.map(String)}
          value={String(pageSize)}
          onChange={(value) => {
            const size = PAGE_SIZES.find((option) => String(option) === value);
            if (size) onPageSizeChange(size);
          }}
          allowDeselect={false}
          w={90}
        />
        <Text c="dimmed" fz="sm">
          {formatCount(first)} to {formatCount(last)} of {formatCount(total)}
        </Text>
      </Group>
      <Pagination
        total={pageCount}
        value={page}
        onChange={onPageChange}
        getControlProps={(control) => ({ 'aria-label': `${control} page` })}
      />
    </Group>
  );
}
