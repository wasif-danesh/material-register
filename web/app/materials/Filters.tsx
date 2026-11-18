import { MultiSelect, SimpleGrid } from '@mantine/core';
import {
  MATERIAL_STATUSES,
  MATERIAL_TYPES,
  type MaterialStatus,
  type MaterialType,
} from '@material-register/shared';
import type { FilterOptions } from '../trpc.ts';
import type { TableState } from './tableState.ts';

type FiltersProps = {
  state: TableState;
  /** Plants and manufacturers from the API; undefined while they load. */
  options: FilterOptions | undefined;
  optionsFailed: boolean;
  onChange: (changes: Partial<TableState>) => void;
};

/**
 * Four multi-select filters. Each one applies as soon as it changes: a dropdown choice
 * is a deliberate action, unlike a keystroke in the search box.
 */
export function Filters({ state, options, optionsFailed, onChange }: FiltersProps) {
  // Mantine selects work with string values, so ids are converted on the way in and out.
  const plantChoices = (options?.plants ?? []).map((plant) => ({
    value: String(plant.id),
    label: `${plant.code} · ${plant.name}`,
  }));
  const manufacturerChoices = (options?.manufacturers ?? []).map((manufacturer) => ({
    value: String(manufacturer.id),
    label: manufacturer.name,
  }));
  const optionsError = optionsFailed ? "Couldn't load the choices" : undefined;

  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">
      <MultiSelect
        label="Type"
        placeholder={state.types.length === 0 ? 'Any' : undefined}
        data={MATERIAL_TYPES}
        value={state.types}
        onChange={(values) => onChange({ types: values as MaterialType[] })}
        clearable
      />
      <MultiSelect
        label="Status"
        placeholder={state.statuses.length === 0 ? 'Any' : undefined}
        data={MATERIAL_STATUSES}
        value={state.statuses}
        onChange={(values) => onChange({ statuses: values as MaterialStatus[] })}
        clearable
      />
      <MultiSelect
        label="Plant"
        placeholder={state.plantIds.length === 0 ? 'Any' : undefined}
        data={plantChoices}
        value={state.plantIds.map(String)}
        onChange={(values) => onChange({ plantIds: values.map(Number) })}
        disabled={!options}
        error={optionsError}
        searchable
        clearable
      />
      <MultiSelect
        label="Manufacturer"
        placeholder={state.manufacturerIds.length === 0 ? 'Any' : undefined}
        data={manufacturerChoices}
        value={state.manufacturerIds.map(String)}
        onChange={(values) => onChange({ manufacturerIds: values.map(Number) })}
        disabled={!options}
        error={optionsError}
        searchable
        clearable
        nothingFoundMessage="No manufacturer found"
      />
    </SimpleGrid>
  );
}
