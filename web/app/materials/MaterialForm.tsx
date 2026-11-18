import {
  Alert,
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import {
  MATERIAL_STATUSES,
  MATERIAL_TYPES,
  materialFieldsSchema,
  UNITS_OF_MEASURE,
  type MaterialFormValues,
} from '@material-register/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC, type FilterOptions, type Material } from '../trpc.ts';

function toFormValues(material: Material): MaterialFormValues {
  return {
    description: material.description,
    materialType: material.materialType,
    status: material.status,
    plantId: material.plant.id,
    manufacturerId: material.manufacturer?.id ?? null,
    manufacturerPartNumber: material.manufacturerPartNumber ?? '',
    unitOfMeasure: material.unitOfMeasure,
    unitPrice: material.unitPrice,
    quantityOnHand: material.quantityOnHand,
  };
}

type MaterialFormProps = {
  material: Material;
  /** Plants and manufacturers; undefined while they load. */
  options: FilterOptions | undefined;
};

export function MaterialForm({ material, options }: MaterialFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<MaterialFormValues>({
    initialValues: toFormValues(material),
    // The same schema the API validates with, so the browser and the server give the
    // same messages. The browser check is for speed; the server check is the real one.
    validate: schemaResolver(materialFieldsSchema, { sync: true }),
  });

  const save = useMutation(
    trpc.materials.update.mutationOptions({
      onSuccess(saved) {
        // Show the saved values (the server trims text) and mark the form as unchanged.
        const values = toFormValues(saved);
        form.setValues(values);
        form.resetDirty(values);
        // Update this page's cached copy, and make every cached page of the list
        // refetch, since the edit may have changed what a search or filter matches.
        queryClient.setQueryData(trpc.materials.byId.queryKey({ id: saved.id }), saved);
        void queryClient.invalidateQueries(trpc.materials.list.pathFilter());
      },
      onError(error) {
        // If the server rejects a field the browser accepted, show its message beside
        // that field, exactly as a browser-side error would appear.
        const fieldErrors = error.data?.fieldErrors;
        if (fieldErrors) {
          form.setErrors(
            Object.fromEntries(
              Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]]),
            ),
          );
        }
      },
    }),
  );

  const plantChoices = (options?.plants ?? []).map((plant) => ({
    value: String(plant.id),
    label: `${plant.code} · ${plant.name}`,
  }));
  const manufacturerChoices = (options?.manufacturers ?? []).map((manufacturer) => ({
    value: String(manufacturer.id),
    label: manufacturer.name,
  }));

  return (
    // onSubmit only calls save when every field passes validation.
    <form
      onSubmit={form.onSubmit((values) => save.mutate({ id: material.id, ...values }))}
      noValidate
    >
      <Stack gap="md">
        <TextInput label="Description" required {...form.getInputProps('description')} />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <Select
            label="Type"
            data={MATERIAL_TYPES}
            allowDeselect={false}
            {...form.getInputProps('materialType')}
          />
          <Select
            label="Status"
            data={MATERIAL_STATUSES}
            allowDeselect={false}
            {...form.getInputProps('status')}
          />
          {/* Mantine selects hold strings, so the two id fields are converted by hand. */}
          <Select
            label="Plant"
            data={plantChoices}
            value={String(form.values.plantId)}
            onChange={(value) => value && form.setFieldValue('plantId', Number(value))}
            error={form.errors.plantId}
            disabled={!options}
            allowDeselect={false}
            searchable
          />
          <Select
            label="Manufacturer"
            placeholder="None"
            data={manufacturerChoices}
            value={form.values.manufacturerId === null ? null : String(form.values.manufacturerId)}
            onChange={(value) =>
              form.setFieldValue('manufacturerId', value === null ? null : Number(value))
            }
            error={form.errors.manufacturerId}
            disabled={!options}
            searchable
            clearable
          />
          <TextInput
            label="Manufacturer part number"
            {...form.getInputProps('manufacturerPartNumber')}
            value={form.values.manufacturerPartNumber ?? ''}
          />
          <Select
            label="Unit of measure"
            data={UNITS_OF_MEASURE}
            allowDeselect={false}
            {...form.getInputProps('unitOfMeasure')}
          />
          {/* A text box, not a number box: the price stays an exact decimal string and
              never passes through a floating-point number. */}
          <TextInput
            label="Unit price (AUD)"
            inputMode="decimal"
            required
            {...form.getInputProps('unitPrice')}
          />
          <NumberInput
            label="Quantity on hand"
            allowDecimal={false}
            allowNegative={false}
            required
            {...form.getInputProps('quantityOnHand')}
          />
        </SimpleGrid>

        {save.isError && !save.error.data?.fieldErrors && (
          <Alert color="red" title="Couldn't save">
            {save.error.message}
          </Alert>
        )}
        {/* Hidden again as soon as the user edits something after saving. */}
        {save.isSuccess && !form.isDirty() && (
          <Alert color="green" title="Saved" role="status">
            Your changes are stored.
          </Alert>
        )}

        <Group>
          <Button type="submit" loading={save.isPending} disabled={!form.isDirty()}>
            Save changes
          </Button>
          <Button variant="default" onClick={() => form.reset()} disabled={!form.isDirty()}>
            Discard changes
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
