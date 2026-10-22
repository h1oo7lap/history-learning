-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "lesson_chunks" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "heading" TEXT,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(768),
    "embeddingModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_chunks_lessonId_chunkIndex_key" ON "lesson_chunks"("lessonId", "chunkIndex");

-- CreateIndex
CREATE INDEX "lesson_chunks_lessonId_idx" ON "lesson_chunks"("lessonId");

-- CreateIndex HNSW cosine
CREATE INDEX "lesson_chunks_embedding_hnsw_idx" ON "lesson_chunks" USING hnsw ("embedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "lesson_chunks" ADD CONSTRAINT "lesson_chunks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
