import { manufacturers, materials, plants } from '../db/schema.ts';

/**
 * The shape of a material as the API returns it, with its plant and manufacturer
 * nested. The list and the single-material query both select exactly this, so a row in
 * the table and the detail page always agree.
 */
export const MATERIAL_FIELDS = {
  id: materials.id,
  materialNumber: materials.materialNumber,
  description: materials.description,
  materialType: materials.materialType,
  status: materials.status,
  manufacturerPartNumber: materials.manufacturerPartNumber,
  unitOfMeasure: materials.unitOfMeasure,
  unitPrice: materials.unitPrice,
  quantityOnHand: materials.quantityOnHand,
  createdAt: materials.createdAt,
  updatedAt: materials.updatedAt,
  plant: { id: plants.id, code: plants.code, name: plants.name },
  manufacturer: { id: manufacturers.id, name: manufacturers.name },
};
