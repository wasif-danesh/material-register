import { Alert, Anchor, Badge, Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router';
import { formatDate } from '../materials/format.ts';
import { MaterialForm } from '../materials/MaterialForm.tsx';
import type { MaterialLinkState } from '../materials/MaterialsTable.tsx';
import { STATUS_COLORS } from '../theme.ts';
import { useTRPC } from '../trpc.ts';

// The tab title until the material has loaded; the page then renders its own <title>.
export function meta() {
  return [{ title: 'Material register' }];
}

export default function MaterialPage() {
  const trpc = useTRPC();
  const params = useParams();
  const location = useLocation();

  const id = Number(params.id);
  // "/materials/abc" or "/materials/0" cannot be a material; skip the request.
  const isValidId = Number.isInteger(id) && id > 0;

  // Back to the list as the user left it (search, filters, page). When this page was
  // opened directly from a link there is no list view to return to, so go to the start.
  const listSearch = (location.state as MaterialLinkState | null)?.listSearch ?? '';
  const backLink = (
    <Anchor component={Link} to={`/${listSearch}`} fz="sm">
      <Group gap={4}>
        <IconArrowLeft size={14} aria-hidden />
        Back to materials
      </Group>
    </Anchor>
  );

  const material = useQuery(
    trpc.materials.byId.queryOptions(
      { id },
      {
        enabled: isValidId,
        // Asking again will not make a missing material appear.
        retry: (failures, error) => error.data?.code !== 'NOT_FOUND' && failures < 1,
      },
    ),
  );
  const options = useQuery(trpc.meta.options.queryOptions(undefined, { staleTime: Infinity }));

  if (!isValidId || material.error?.data?.code === 'NOT_FOUND') {
    return (
      <Stack gap="md" align="flex-start">
        <title>Material not found · Material register</title>
        {backLink}
        <Title order={2}>Material not found</Title>
        <Text c="dimmed">It may have been removed, or the link may be wrong.</Text>
      </Stack>
    );
  }

  if (material.isError) {
    return (
      <Stack gap="md" align="flex-start">
        {backLink}
        <Alert color="red" title="Couldn't load this material">
          <Stack gap="sm" align="flex-start">
            <Text fz="sm">Check your connection and try again.</Text>
            <Button variant="default" size="xs" onClick={() => material.refetch()}>
              Retry
            </Button>
          </Stack>
        </Alert>
      </Stack>
    );
  }

  if (!material.data) {
    return (
      <Stack gap="md" maw={720}>
        {backLink}
        <Skeleton height={32} width={240} />
        <Skeleton height={320} />
      </Stack>
    );
  }

  return (
    <Stack gap="md" maw={720}>
      {/* React moves a <title> rendered anywhere into the document head. */}
      <title>{`${material.data.materialNumber} · Material register`}</title>
      {backLink}
      <Group gap="sm">
        <Title order={2} ff="monospace">
          {material.data.materialNumber}
        </Title>
        <Badge variant="light" color={STATUS_COLORS[material.data.status]}>
          {material.data.status}
        </Badge>
      </Group>
      <Text c="dimmed" fz="sm">
        Created {formatDate(material.data.createdAt)} · Last updated{' '}
        {formatDate(material.data.updatedAt)}
      </Text>
      <MaterialForm material={material.data} options={options.data} />
    </Stack>
  );
}
