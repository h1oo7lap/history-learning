-- 1. CreateTable quiz_lessons
CREATE TABLE "quiz_lessons" (
    "quizId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,

    CONSTRAINT "quiz_lessons_pkey" PRIMARY KEY ("quizId","lessonId")
);

-- 2. CreateIndex for lessonId on quiz_lessons
CREATE INDEX "quiz_lessons_lessonId_idx" ON "quiz_lessons"("lessonId");

-- 3. AlterTable quizzes: Add nullable gradeId column first
ALTER TABLE "quizzes" ADD COLUMN "gradeId" TEXT;

-- 4. Backfill gradeId from linked lesson
UPDATE "quizzes" q
SET "gradeId" = (
  SELECT l."gradeId"
  FROM "lessons" l
  WHERE l.id = q."lessonId"
);

-- 5. Fallback for any quizzes without grade: default to Grade 4 (first grade)
UPDATE "quizzes"
SET "gradeId" = (SELECT id FROM "grades" ORDER BY "displayOrder" ASC LIMIT 1)
WHERE "gradeId" IS NULL;

-- 6. Backfill quiz_lessons join table from existing lessonId
INSERT INTO "quiz_lessons" ("quizId", "lessonId")
SELECT id, "lessonId"
FROM "quizzes"
WHERE "lessonId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- 7. DropForeignKey constraint from quizzes.lessonId
ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "quizzes_lessonId_fkey";

-- 8. DropIndex for lessonId
DROP INDEX IF EXISTS "quizzes_lessonId_key";

-- 9. DropColumn lessonId from quizzes
ALTER TABLE "quizzes" DROP COLUMN "lessonId";

-- 10. Make gradeId NOT NULL
ALTER TABLE "quizzes" ALTER COLUMN "gradeId" SET NOT NULL;

-- 11. CreateIndex for gradeId on quizzes
CREATE INDEX "quizzes_gradeId_idx" ON "quizzes"("gradeId");

-- 12. AddForeignKey for quizzes -> grades
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 13. AddForeignKeys for quiz_lessons -> quizzes and quiz_lessons -> lessons
ALTER TABLE "quiz_lessons" ADD CONSTRAINT "quiz_lessons_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_lessons" ADD CONSTRAINT "quiz_lessons_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

