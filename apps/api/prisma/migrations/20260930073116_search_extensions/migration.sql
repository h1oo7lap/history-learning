-- Search extensions for accent-insensitive Vietnamese search
-- Create extensions (idempotent; already done by init.sql in the main DB)
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT unaccent($1) $$;

CREATE INDEX IF NOT EXISTS lessons_title_trgm_idx ON lessons
  USING gin (immutable_unaccent(lower(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS topics_name_trgm_idx ON topics
  USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS characters_name_trgm_idx ON historical_characters
  USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);