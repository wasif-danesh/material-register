# Build plan

## The brief in short

Build a Material Register: a table of material records with search, filters, sorting and
pagination handled in the database, on React Router v7 (SPA), Mantine or shadcn/ui, Node
and TypeScript, PostgreSQL and Drizzle. Seed at least 5,000 realistic records. Table
state lives in the URL. Loading, empty and error states are required.

## Scope

- **Core:** everything in the brief's "Core functionality".
- **Extras:** tests, a detail and edit view, and trigram search with a measurement.
  The brief says to pick one at most; doing three is a deliberate choice and the README
  says so.
- **Deferred:** natural-language filters.

## Stages

Each stage ends with a real check and one commit.

| #   | Stage            | What is built                                                                                | How it is checked                                                   |
| --- | ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Setup and schema | Workspaces, lint and format, Docker Compose, Drizzle schema, first migration                 | Migration applied to a clean database; constraints tried by hand    |
| 2   | Seed             | Part-family catalogue, plants, manufacturers, 10,000 materials from a fixed random seed      | Row counts by status, type and plant; sample rows read              |
| 3   | API              | Express, tRPC, `materials.list`, `meta.options`, `/health`, error handling, request logging  | Real calls for search, each filter, each sort, paging, bad input    |
| 4   | Front end        | Table, search with button, four filters, sorting, pagination, URL state, three states, theme | Every control used in a browser; refresh and shared link            |
| 5   | Tests            | Vitest against real Postgres for the list query and input validation                         | Tests pass, and fail when the query is broken on purpose            |
| 6   | Detail and edit  | `materials.byId`, `materials.update`, the form with validation                               | Edit saved and visible in the list; bad input rejected on each side |
| 7   | Trigram search   | `pg_trgm` indexes in a new migration                                                         | `EXPLAIN ANALYZE` before and after on 200,000 rows                  |
| 8   | CI               | GitHub Actions: lint, type-check, migrate, test, build                                       | A green run on GitHub                                               |
| 9   | Deployment       | `render.yaml` for the web app, API and database                                              | The live URL works end to end                                       |
| 10  | README           | Setup, ER diagram, decision table, engineering practices, AI usage, AWS section              | Setup followed from a fresh clone                                   |

## Agreed design

- **Tables:** `plants`, `manufacturers`, `materials`. One plant per material; the
  manufacturer is optional.
- **Search:** one box, run by a Search button or Enter, matching material number,
  description and manufacturer part number with `ILIKE`.
- **Filters:** type, status, plant and manufacturer, each multi-select. Values inside
  one filter are joined by OR; filters are joined by AND.
- **Sorting:** material number, description, unit price, quantity on hand, last updated.
  Default is last updated, newest first, with `id` as the tie-break.
- **Pagination:** offset and limit with a total count. Page sizes 10, 25, 50, 100.
- **URL parameters:** `q`, `type`, `status`, `plant`, `mfr`, `sort`, `dir`, `page`,
  `size`. Defaults are left out of the URL.
- **Table:** one field per column, so every sort arrow means exactly one field.
