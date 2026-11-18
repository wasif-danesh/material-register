import { MultiSelect, rem, SimpleGrid } from '@mantine/core';
import {
  MATERIAL_STATUSES,
  MATERIAL_TYPES,
  type MaterialStatus,
  type MaterialType,
} from '@material-register/shared';
import type { FilterOptions } from '../trpc.ts';
import type { TableState } from './tableState.ts';

// A searchable multi-select keeps a text field after its pills. Mantine reserves 100px
// for it, so once the pills fill most of a row the field drops to a new, empty-looking
// line and the control grows taller than its neighbours. A smaller minimum lets the
// field share the last row of pills; it still stretches to fill whatever space is left.
// The searchable filters also set selectFirstOptionOnChange, so typing part of a name and
// pressing Enter picks the first match without needing the arrow keys.
const SEARCH_FIELD_STYLES = { inputField: { minWidth: rem(32) } };

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
        selectFirstOptionOnChange
        styles={SEARCH_FIELD_STYLES}
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
        selectFirstOptionOnChange
        styles={SEARCH_FIELD_STYLES}
        clearable
        nothingFoundMessage="No manufacturer found"
      />
    </SimpleGrid>
  );
}
