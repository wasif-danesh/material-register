-- A custom migration: Drizzle generates tables and indexes from schema.ts, but it does
-- not manage Postgres extensions. pg_trgm provides the gin_trgm_ops operator class
-- that the trigram indexes in the next migration use. It ships with Postgres.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
