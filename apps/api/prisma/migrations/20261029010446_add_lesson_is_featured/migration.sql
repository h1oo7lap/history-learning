-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "lessons_isFeatured_idx" ON "lessons"("isFeatured");
