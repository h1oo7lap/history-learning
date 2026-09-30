-- Runs once when the Postgres volume is first created.
-- Separate database for automated tests (never run tests on the dev DB).
CREATE DATABASE history_learning_test OWNER history;

-- Extensions for accent-insensitive Vietnamese search
\connect history_learning
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

\connect history_learning_test
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
