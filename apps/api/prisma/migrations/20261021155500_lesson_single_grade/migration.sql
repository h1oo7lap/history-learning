-- AlterTable: Add nullable column first
ALTER TABLE "lessons" ADD COLUMN "gradeId" TEXT;

-- Backfill gradeId from lesson_grades (pick first linked grade)
UPDATE "lessons" l
SET "gradeId" = (
  SELECT lg."gradeId"
  FROM "lesson_grades" lg
  WHERE lg."lessonId" = l.id
  LIMIT 1
);

-- Fallback for any lessons without grade: default to Grade 4 (first grade)
UPDATE "lessons"
SET "gradeId" = (SELECT id FROM "grades" ORDER BY "displayOrder" ASC LIMIT 1)
WHERE "gradeId" IS NULL;

-- Make gradeId NOT NULL
ALTER TABLE "lessons" ALTER COLUMN "gradeId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "lesson_grades" DROP CONSTRAINT IF EXISTS "lesson_grades_gradeId_fkey";

-- DropForeignKey
ALTER TABLE "lesson_grades" DROP CONSTRAINT IF EXISTS "lesson_grades_lessonId_fkey";

-- DropTable
DROP TABLE "lesson_grades";

-- CreateIndex
CREATE INDEX "lessons_gradeId_idx" ON "lessons"("gradeId");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
