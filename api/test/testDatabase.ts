// Tests run against their own database, never the development one, because they
// replace all data with fixtures. CI can point this somewhere else.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/material_register_test';
