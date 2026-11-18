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
