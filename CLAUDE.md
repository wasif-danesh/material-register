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

## Layout

- `shared/` - value lists and Zod schemas used by both sides. No server-only code.
- `api/` - Express, tRPC routers, Drizzle schema and migrations (`api/drizzle`).
- `web/` - the React Router app (added in stage 4).

## Commands

- `npm run db:up` - start Postgres and wait until it is healthy.
- `npm run db:generate` - write a new migration after changing `api/src/db/schema.ts`.
- `npm run db:migrate` - apply migrations.
- `npm run db:seed` - replace all data with 10,000 materials (`-- 200000` for more).
  The data is the same on every run.
- `npm run lint`, `npm run typecheck`, `npm run format` - run all three before finishing.

## Rules

- Search, filtering, sorting and pagination happen in SQL. Never filter or sort rows
  in the browser.
- Every API input is validated with Zod. Sort columns come from a fixed allow-list.
- The URL is the single source of truth for table state (search, filters, sort, page).
- Fixed value sets (types, statuses, units) are defined once in `shared/src/index.ts`.
- Never edit a generated migration by hand; change the schema and generate a new one.
- Styling uses Mantine theme tokens only. No hard-coded colours or pixel font sizes.
- Comments explain why, not what. Comment non-obvious decisions (tie-breaks, escaping,
  allow-lists). Do not add a comment that repeats a function's name.
- Keep it simple. No new dependency without a reason that fits in one sentence.

## Way of working

- Work in the stages listed in `docs/plan.md`, one at a time.
- A stage is finished only after a real check: a query against the database, a test
  run, or the page in a browser. Passing type-checks alone is not a check.
- The owner makes every commit. Stage the files and propose a one-line message.
- When the agent gets something wrong and it is corrected, add a line to
  `docs/ai-notes.md`. The README's "How I used AI" section is written from that file.
