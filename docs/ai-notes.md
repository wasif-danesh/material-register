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

## Stage 4: front end

- **Docs before code.** Mantine 9 is newer than the agent's training data, so it read
  Mantine's own React Router guide and the 8-to-9 migration guide (from the `llms.txt`
  index Mantine publishes for coding agents) before writing components.
- **One schema, both sides.** The web app reads the URL with the same Zod schema the
  API validates with (`web/app/materials/tableState.ts`), so the URL parameters and the
  API input cannot drift apart.
- **Retry button (corrected).** In the error state, Retry reloaded the table but left
  the plant and manufacturer dropdowns stuck on "Couldn't load the choices". Found by
  stopping the database with the page open. Retry now reloads both.
- **A simplification I accepted.** The plan said to bundle one interface font. The app
  uses the operating system's own font instead: nothing to download and one fewer
  dependency.
- **Check for this stage, in a real browser.** Typed a search and confirmed no request
  until Enter; picked each of the four filters; the brief's example again gave 74 rows;
  sorted a column both ways; changed page and page size; confirmed sorting returns to
  page 1; opened a full link in a fresh load; cleared; used the back button; opened an
  empty result, a page past the end, and a link with invalid parameters; stopped the
  database for the error state and recovered with Retry; switched to the light theme;
  and checked a 375-pixel-wide screen, where only the table scrolls sideways. The
  production build succeeds and contains no server code.
- **Filter height (reported by me).** With several values picked, the Plant and
  Manufacturer filters grew an empty extra line, so the four filters no longer lined
  up. Cause: Mantine reserves 100px for the search field inside a searchable
  multi-select, which pushed it onto its own row. Fixed with a smaller minimum width.
  While checking that, the agent found that typing a name and pressing Enter selected
  nothing, and added `selectFirstOptionOnChange`.
