# Search performance: trigram indexes

The search box runs a "contains" match on three columns:

```sql
WHERE material_number ILIKE '%text%'
   OR description ILIKE '%text%'
   OR manufacturer_part_number ILIKE '%text%'
```

An ordinary index cannot serve this, because the text may start anywhere in the value,
so Postgres reads every row. Migrations `0001` and `0002` add the `pg_trgm` extension
and one GIN trigram index per column. The query did not change.

## How it was measured

- **Data:** 200,000 materials (`npm run db:seed -- 200000`), then `ANALYZE`.
- **Queries:** the two the API runs for every search: the page query (joins, newest
  first, 25 rows) and the count query.
- **Tool:** `EXPLAIN (ANALYZE)` in `psql`, which reports the time inside Postgres.
- **Runs:** each query 7 times; the table shows the median.
- **Machine:** Postgres 17 in Docker on a laptop. The numbers are for comparison, not
  absolute.

## Results

Times are in milliseconds.

| Search             | Matching rows | Page before | Page after | Count before | Count after |
| ------------------ | ------------: | ----------: | ---------: | -----------: | ----------: |
| `6205`             |           180 |        25.8 |        0.7 |         39.4 |         0.6 |
| `MAT-0001`         |           100 |        40.2 |        2.1 |         39.8 |         2.0 |
| `zzzzqq`           |             0 |        39.1 |        0.1 |         38.0 |         0.1 |
| `SPB2000`          |           370 |        12.4 |       12.0 |         41.4 |         1.1 |
| `spherical roller` |         4,233 |         2.5 |        2.2 |         46.8 |         6.0 |
| `bearing`          |        30,350 |         0.6 |        0.6 |         38.0 |        18.2 |
| `be`               |        43,260 |         0.4 |        0.4 |         35.3 |        36.1 |

## What the numbers say

- **Selective searches improved most.** A part-number fragment or a search with no
  match went from about 40 ms to under 2 ms for each query. These are the searches a
  planner makes most: a code, or part of one.
- **The count query was the real cost before.** It had to read all 200,000 rows for
  every search, however many matched. It now reads only the matching rows.
- **Common words improved less.** `bearing` matches 15% of the table. The count still
  has to visit 30,350 rows, so it only halved.
- **The page query for common words was already fast.** Postgres walks the
  "last updated" index from the newest row and stops after 25 matches, which takes
  under a millisecond when matches are frequent.
- **One case did not improve: the `SPB2000` page query.** With 370 matches, Postgres
  still chose to walk the "last updated" index instead of using the trigram index,
  because it estimated that to be cheaper. At 12 ms it is not a problem, but it shows
  the index is used only when the planner expects it to win.
- **Two-character searches cannot use the indexes at all.** A trigram needs three
  characters, so `be` runs exactly as before.

## What it costs

- **Disk:** the indexes on `materials` grew from 24 MB to 47 MB, for a 27 MB table. The
  description index alone is 13 MB.
- **Writes:** inserting 20,000 rows took about 150 ms without the trigram indexes and
  about 320 ms with them, roughly twice as long. The register is read far more than it
  is written, so this is a good trade.

## At the default 10,000 rows

The same count query for `6205` (8 matching rows):

| Plan                         | Time    |
| ---------------------------- | ------- |
| Reading every row (no index) | 5.5 ms  |
| Trigram index                | 0.13 ms |

So the indexes already help at the default size, but 5 ms was never a problem. They are
in the schema because a catalogue synced from SAP is realistically hundreds of thousands
of rows, the cost is small, and the query needed no change.

## A trap found while measuring

Straight after the seed script, the 10,000-row search was **not** using the indexes:
Postgres read every row. A GIN index does not sort new entries as they arrive; it
keeps them in a "pending list" that is merged later by `VACUUM` (normally by
autovacuum, some time afterwards). Until then the index is slow to read, and the
planner had no statistics for the freshly loaded rows either.

The seed script now ends with `VACUUM ANALYZE materials`, so the database is in its
normal state as soon as seeding finishes. In production the same thing applies after
any bulk import, such as a large SAP sync: run `VACUUM ANALYZE` afterwards, or accept
slower searches until autovacuum runs.

The 200,000-row figures above are not affected: there the indexes were created after
the data was loaded, which builds them fully sorted.
