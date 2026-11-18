# Material Register

A take-home assessment: a web app that shows material records in a table with search,
filters, sorting and pagination, all done in the database. The brief is summarised in
`docs/plan.md`.

## Stack (fixed by the brief unless marked)

- Front end: React Router **v7** in SPA mode (`ssr: false`), Vite, TypeScript. Do not
  upgrade to React Router 8; the brief requires v7.
- UI: Mantine (our choice). Use Mantine's own table.
- API: Node and TypeScript, tRPC on Express (our choice), Zod for validation.
- Database: PostgreSQL in Docker Compose, Drizzle ORM for schema, migrations and queries.
- TypeScript 6, because `typescript-eslint` does not support 7 yet.
- Node 24 runs the API's TypeScript directly (it strips the types), so there is no
  compile step. That only works with erasable syntax: no `enum`, no constructor
  parameter properties, `import type` for types, and `.ts` in relative imports.
- Hosting: `render.yaml` describes the demo on Render (static site, API, Postgres).

## Layout

- `shared/` - value lists and Zod schemas used by both sides. No server-only code.
- `api/` - Express, tRPC routers, Drizzle schema and migrations (`api/drizzle`).
  Procedures in `router.ts` stay thin; query logic goes in `api/src/materials`.
- `web/` - the React Router app. `app/routes/materials.tsx` is the list page and
  `app/routes/material.tsx` the detail and edit page; `app/materials/` holds their
  parts; `app/materials/tableState.ts` maps the URL to the API input; `app/theme.ts`
  is the only place for colours and fonts.

## Commands

- `npm run db:up` - start Postgres and wait until it is healthy.
- `npm run db:generate` - write a new migration after changing `api/src/db/schema.ts`.
- `npm run db:migrate` - apply migrations.
- `npm run db:seed` - replace all data with 10,000 materials (`-- 200000` for more).
  The data is the same on every run.
- `npm run dev` - start the API (port 3001) and the web app (port 5173) together.
- `npm run build` - production build of the web app.
- `npm test` - API tests against the `material_register_test` database (created on
  first run; needs `npm run db:up`). Fixtures are in `api/test/fixtures.ts`.
- `npm run lint`, `npm run typecheck`, `npm run format` - run all three, and `npm test`,
  before finishing.

CI (`.github/workflows/ci.yml`) runs these same commands on every push and pull request.

## Rules

- Search, filtering, sorting and pagination happen in SQL. Never filter or sort rows
  in the browser.
- Every API input is validated with Zod. Sort columns come from a fixed allow-list.
- The URL is the single source of truth for table state (search, filters, sort, page).
- Fixed value sets (types, statuses, units) are defined once in `shared/src/index.ts`.
- Never edit a generated migration by hand; change the schema and generate a new one.
  For SQL that Drizzle cannot express (an extension, for example), create an empty
  migration with `npx drizzle-kit generate --custom --name <name>` and write it there.
- After a bulk load, run `VACUUM ANALYZE`; the seed script does. Until then the trigram
  search indexes are not used (see `docs/search-performance.md`).
- Styling uses Mantine theme tokens only. No hard-coded colours or pixel font sizes.
- Comments explain why, not what. Comment non-obvious decisions (tie-breaks, escaping,
  allow-lists). Do not add a comment that repeats a function's name.
- A change to `listMaterials.ts` or the input schema needs a test in `api/test`.
- Keep it simple. No new dependency without a reason that fits in one sentence.

## Adding a filter or a column

A filter touches four places, in this order:

1. `shared/src/schemas.ts` - add the field to `listMaterialsInputSchema`.
2. `api/src/materials/listMaterials.ts` - add its condition in `buildWhere`.
3. `web/app/materials/tableState.ts` - read and write its URL parameter.
4. `web/app/materials/Filters.tsx` - add the control.

A column touches two: `MATERIAL_FIELDS` in `api/src/materials/materialFields.ts` (if the
field is not returned yet) and `COLUMNS` plus the row cells in
`web/app/materials/MaterialsTable.tsx`. To make
it sortable, also add it to `SORT_FIELDS` and `SORT_COLUMNS`.

Check Mantine 9 usage against https://mantine.dev/llms.txt, not from memory.

An editable field touches three: `materialFieldsSchema` in `shared/src/schemas.ts`,
`toFormValues` and the inputs in `web/app/materials/MaterialForm.tsx`, and a test in
`api/test/updateMaterial.test.ts`.

## Way of working

- Work in the stages listed in `docs/plan.md`, one at a time.
- A stage is finished only after a real check: a query against the database, a test
  run, or the page in a browser. Passing type-checks alone is not a check.
- The owner makes every commit. Stage the files and propose a one-line message.
- When the agent gets something wrong and it is corrected, add a line to
  `docs/ai-notes.md`. The README's "How I used AI" section is written from that file.
