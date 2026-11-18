# Material Register

A web app for searching and filtering a catalogue of material records.

> Work in progress. This README is completed in the last stage; see `docs/plan.md`.

## Setup so far

Requires Node 24 and Docker.

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Then open http://localhost:5173. The API runs on http://localhost:3001.

## Tests

```bash
npm test
```

The tests use their own database, `material_register_test`, which is created on the
first run. The development data is not touched.
