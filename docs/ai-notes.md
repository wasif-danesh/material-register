# AI notes

A running record of how Claude Code was used and what had to be corrected. The README's
"How I used AI" section is written from this file.

## Stage 1: setup and schema

- **Planning came first.** The stack, schema, API shape, seed approach and page layout
  were settled in discussion, with two mockups, before any file was written.
- **React Router version.** The newest release on npm was 8. The brief requires v7, so
  the agent checked the registry and pinned 7 instead of installing the latest.
- **TypeScript version.** The newest release was 7, which `typescript-eslint` does not
  support yet. Pinned 6.
- **Index direction (corrected).** The agent first declared the default-sort index as
  `(updated_at DESC, id DESC)`. Drizzle generated `DESC NULLS LAST`, which does not
  match a plain `ORDER BY updated_at DESC`. Replaced with a plain ascending index, and
  confirmed with `EXPLAIN` that Postgres reads it backwards for the default sort.
- **Mockup review (corrected by me).** The first page mockup put the search field in
  the same row as the filters and combined two fields in one column. I asked for a
  separate search row with a button, and one field per column so sorting is unambiguous.
- **Check for this stage.** Migration applied to a clean database twice (the second run
  is a no-op). Tried by hand: a negative price, a duplicate material number, an unknown
  material type, an unknown plant, and deleting a plant that is in use. All five were
  rejected by the database.

## Stage 2: seed data

- **Approach.** Faker alone gives unrealistic product names, so the data comes from a
  hand-reviewed catalogue of 43 part families (`api/src/db/seed/catalogue.ts`). Faker
  only makes the random choices, from a fixed seed. The agent drafted the families; the
  manufacturers are real brands and the part numbers are invented.
- **Stock spread (corrected).** The first run left 20% of materials with zero stock,
  not the intended 15%, because the random stock range also started at zero. The check
  query showed it; the non-empty range now starts at one.
- **Check for this stage.** Seeded twice and compared a checksum of every row: the data
  is identical on each run. Read sample rows, counted by status, type and plant, and
  confirmed no raw material has a maker, no placeholder was left unfilled, and no row
  was created after it was updated. The brief's own example (active SKF bearings at
  Brisbane) returns 74 rows.

## Stage 3: API

- **Structure.** The tRPC procedures only validate and delegate. The query logic is in
  plain functions (`api/src/materials`), so tests can call it without HTTP.
- **Process crash on database restart (found by testing).** Stopping the database while
  the API was running is a check the agent ran on purpose. The `pg` pool throws an
  uncaught exception when an idle connection dies unless it has an error listener, so
  one was added in `api/src/db/client.ts`. With it, the API answered 503 on `/health`
  and a generic 500 on the list, then recovered by itself when the database came back.
- **Log path (corrected).** The request log printed `/materials.list` without the
  `/trpc` prefix, because Express shortens `req.path` inside a mounted router. Changed
  to `req.originalUrl`.
- **Check for this stage.** A script made about 50 real HTTP calls: search on each of
  the three columns in mixed case; `%` and `_` treated as plain text; each filter alone
  and combined; every sort column in both directions, paging through all 10,000 rows to
  prove each row appears exactly once and in order; a page past the end; and seven kinds
  of bad input, each rejected with a 400 and a per-field message. The brief's example
  returned the same 74 rows as the SQL written by hand in stage 2.
