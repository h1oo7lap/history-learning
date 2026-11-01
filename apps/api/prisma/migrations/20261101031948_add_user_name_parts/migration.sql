-- AlterTable
ALTER TABLE "users" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

-- Backfill existing names: last word is firstName, preceding words are lastName
UPDATE "users"
SET 
  "firstName" = CASE 
    WHEN position(' ' in trim("fullName")) > 0 
    THEN regexp_replace(trim("fullName"), '^.*\s+', '')
    ELSE trim("fullName")
  END,
  "lastName" = CASE 
    WHEN position(' ' in trim("fullName")) > 0 
    THEN regexp_replace(trim("fullName"), '\s+\S+$', '')
    ELSE ''
  END
WHERE "firstName" = '' AND "fullName" <> '';
