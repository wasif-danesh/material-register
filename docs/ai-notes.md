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

## Stage 5: tests

- **What is tested.** The list query and its input validation, against a real Postgres:
  the behaviour worth testing here is the SQL, so mocking the database would test
  nothing. 33 tests run in under a second.
- **Hand-written fixtures.** Tests use 12 rows written by hand (`api/test/fixtures.ts`),
  not the 10,000 seeded ones, so each expected result can be checked by reading the file.
- **Separate database with a guard.** Tests replace all data, so they use
  `material_register_test`, created on first run. The setup refuses to run against any
  database whose name does not end in `_test`. I confirmed the guard by pointing the
  tests at the development database: they refused, and its 10,000 rows were untouched.
- **Proving the tests can fail.** All 33 passed on the first run, which proves little.
  The agent then broke the query five ways, one at a time: no tie-break, no wildcard
  escaping, search skipping the part number, an inner join in place of the left join,
  and a count that ignores the filters. Each was caught by between one and four tests.

## Stage 6: detail and edit view

- **One schema for the form and the API.** `materialFieldsSchema` in `shared` validates
  the edit form in the browser and the same request on the server, so both give the
  same messages. Mantine 9 accepts a Zod schema directly (`schemaResolver`), which the
  agent learned from the migration guide; its training data had the older, removed API.
- **Money stays a string.** The price field is a text box validated by a pattern, not a
  number box, so the value never passes through a floating-point number.
- **Test bug (corrected).** Seven new tests failed on the first run. The code was right;
  the agent's test compared the stored material against the form input, which has a
  different shape. The tests now compare the material before and after a rejected save.
- **Tests that write need isolation.** The update tests change rows that the list tests
  rely on. Test files now run one after another, and the update tests reload the
  fixtures after each test.
- **Development-only glitch.** Adding `@mantine/form` while the dev server was running
  made Vite rebuild its dependency cache mid-session and load a second copy of React,
  which broke the page once. A restart from a cleared cache showed no reload and no
  console errors, so someone following the README will not see it.
- **Check for this stage.** 14 new API tests (47 in total). In the browser: opened a
  material from page 2 of a filtered list; submitted an empty description and a price
  with three decimals and saw both messages; saved a valid edit and saw the trimmed
  text, the price as 705.50 and a new "last updated" date; saw the edited row at the top
  of the list; followed "Back to materials" to the same filtered page; and opened a
  missing id and a non-numeric id, which both show "Material not found".
- **Not checked.** A field the browser accepts but the server rejects, shown beside the
  field. The code path exists, but the shared schema makes it hard to trigger by hand.
- **Hand cursor and row click (requested by me).** I asked for the hand cursor wherever
  something is clickable. The agent measured the cursor on every control instead of
  guessing: buttons, links, sort headers and pagination already had it; dropdowns did
  not, which one theme setting (`cursorType`) fixed. The whole table row now opens the
  material, as the brief words it, while the material number stays a real link for
  keyboard and screen-reader use. A click on the link is ignored by the row handler, so
  it does not navigate twice.

## Stage 7: trigram search

- **Measured before changing anything.** The agent seeded 200,000 rows and timed the
  two queries each search runs, 7 runs each, before adding any index. Full method and
  numbers are in `docs/search-performance.md`.
- **Extension as a custom migration.** Drizzle does not manage Postgres extensions.
  The agent used `drizzle-kit generate --custom` for `CREATE EXTENSION pg_trgm`, so the
  rule "never edit a generated migration by hand" still holds.
- **Reported what did not improve.** Selective searches went from about 40 ms to under
  2 ms. The agent also reported the cases that did not improve: a two-character search,
  and one page query where the planner preferred a different index.
- **A wrong claim, caught by checking (corrected).** The first draft of the write-up
  said the unindexed search at 10,000 rows "takes about 2 ms". That number was a guess.
  Measuring it gave 5.5 ms, and also showed the new indexes were not being used at all
  straight after seeding. Cause: a GIN index holds bulk-loaded entries in a pending
  list until `VACUUM` runs. The seed script now ends with `VACUUM ANALYZE`, and the
  write-up explains the trap.
- **Write cost measured, not assumed.** Inserting 20,000 rows took about twice as long
  with the trigram indexes, measured inside transactions that were rolled back.
