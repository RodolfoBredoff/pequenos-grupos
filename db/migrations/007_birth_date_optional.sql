-- Migration 007: Make birth_date optional again
-- Year can be omitted by using 1900 as a placeholder year
-- Birthday alerts already only compare month and day

ALTER TABLE members ALTER COLUMN birth_date DROP NOT NULL;
