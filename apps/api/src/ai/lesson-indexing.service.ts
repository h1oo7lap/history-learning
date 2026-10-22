import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from './embedding.provider';
import { EmbeddingDiskCache } from './embedding-cache';
import { chunkLesson, type LessonChunkInput } from './chunker';
import { AI } from '@history-learning/shared';
import crypto from 'node:crypto';

@Injectable()
export class LessonIndexingService {
  private readonly logger = new Logger(LessonIndexingService.name);
  private readonly diskCache = new EmbeddingDiskCache();
  private readonly activeTasks = new Set<Promise<any>>();
  public isAutoIndexDisabled = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddingProvider: EmbeddingProvider,
    private readonly config: ConfigService,
  ) {}

  public async waitForPendingTasks(): Promise<void> {
    await Promise.all(Array.from(this.activeTasks));
  }

  /**
   * Non-blocking trigger called by admin lesson mutators.
   * Completely swallowed so admin saving never fails due to embedding errors.
   */
  public triggerAsyncReindex(lessonId: string): void {
    if (this.isAutoIndexDisabled || process.env['NODE_ENV'] === 'test') {
      return;
    }

    const task = this.reindexLesson(lessonId)
      .catch((err) => {
        this.logger.warn(
          `Background reindexing failed for lesson ${lessonId}: ${err?.message || 'unknown error'}`,
        );
      })
      .finally(() => {
        this.activeTasks.delete(task);
      });

    this.activeTasks.add(task);
  }

  /**
   * Reindex a single lesson by ID.
   * Only PUBLISHED lessons keep chunks. Non-published lessons have chunks deleted.
   */
  public async reindexLesson(lessonId: string): Promise<{
    chunkCount: number;
    newCount: number;
    skippedCount: number;
  }> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        characters: { include: { character: true } },
        events: { include: { event: true } },
        grade: true,
      },
    });

    if (!lesson) {
      // Lesson deleted - remove any associated chunks
      await this.prisma.$executeRaw`DELETE FROM lesson_chunks WHERE "lessonId" = ${lessonId}`;
      return { chunkCount: 0, newCount: 0, skippedCount: 0 };
    }

    // Only PUBLISHED lessons have chunks
    if (lesson.status !== 'PUBLISHED') {
      await this.prisma.$executeRaw`DELETE FROM lesson_chunks WHERE "lessonId" = ${lessonId}`;
      return { chunkCount: 0, newCount: 0, skippedCount: 0 };
    }

    const chunkInput: LessonChunkInput = {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      contentJson: lesson.contentJson,
      content: lesson.content,
      characters: lesson.characters?.map((c) => ({
        name: c.character?.name,
        role: c.role,
        slug: c.character?.slug,
      })),
      events: lesson.events?.map((e) => ({
        name: e.event?.name,
        slug: e.event?.slug,
      })),
    };

    const newChunks = chunkLesson(chunkInput);
    if (newChunks.length === 0) {
      await this.prisma.$executeRaw`DELETE FROM lesson_chunks WHERE "lessonId" = ${lessonId}`;
      return { chunkCount: 0, newCount: 0, skippedCount: 0 };
    }

    // Read existing chunks from DB
    const existingRows = await this.prisma.$queryRaw<
      Array<{ chunkIndex: number; contentHash: string; hasEmbedding: boolean }>
    >`
      SELECT "chunkIndex", "contentHash", (embedding IS NOT NULL) AS "hasEmbedding"
      FROM lesson_chunks
      WHERE "lessonId" = ${lessonId}
    `;

    const existingMap = new Map<number, { contentHash: string; hasEmbedding: boolean }>();
    for (const r of existingRows) {
      existingMap.set(r.chunkIndex, {
        contentHash: r.contentHash,
        hasEmbedding: Boolean(r.hasEmbedding),
      });
    }

    const embeddingModel =
      this.config.get<string>('AI_EMBEDDING_MODEL')?.trim() || 'gemini-embedding-2';
    const dimensions = AI.EMBEDDING_DIMENSIONS || 768;

    // Identify chunks that need new embeddings
    const chunksToEmbed: Array<{ index: number; embedText: string }> = [];
    const cachedVectors = new Map<number, number[]>();

    let skippedCount = 0;
    let newCount = 0;

    const isTestEnv = process.env['NODE_ENV'] === 'test';
    const providerName = this.embeddingProvider.constructor.name || 'default';
    const isRealProvider = providerName === 'GeminiEmbeddingProvider';
    const isCacheEnabled = !this.isAutoIndexDisabled && !isTestEnv && isRealProvider;

    for (const chunk of newChunks) {
      const existing = existingMap.get(chunk.chunkIndex);
      if (existing && existing.contentHash === chunk.contentHash && existing.hasEmbedding) {
        // Skip calling embedding API for unchanged chunk
        skippedCount++;
        continue;
      }

      newCount++;

      // Check disk cache: ONLY enabled for real production provider (GeminiEmbeddingProvider) outside test environment
      const cached = isCacheEnabled
        ? this.diskCache.get(providerName, embeddingModel, dimensions, chunk.embedText)
        : null;
      if (cached && cached.length === dimensions) {
        cachedVectors.set(chunk.chunkIndex, cached);
      } else {
        chunksToEmbed.push({ index: chunk.chunkIndex, embedText: chunk.embedText });
      }
    }

    // Fetch embeddings for cache misses with retry/backoff
    if (chunksToEmbed.length > 0) {
      const texts = chunksToEmbed.map((c) => c.embedText);
      const generatedVectors = await this.embedWithBackoff(texts);

      for (let i = 0; i < chunksToEmbed.length; i++) {
        const item = chunksToEmbed[i]!;
        const vec = generatedVectors[i]!;
        cachedVectors.set(item.index, vec);
        // Save to disk cache only for real provider
        if (isCacheEnabled) {
          this.diskCache.set(providerName, embeddingModel, dimensions, item.embedText, vec);
        }
      }
    }

    // Persist to DB
    for (const chunk of newChunks) {
      const newVector = cachedVectors.get(chunk.chunkIndex);

      if (newVector) {
        const vectorStr = `[${newVector.join(',')}]`;
        const chunkId = crypto.randomUUID();

        await this.prisma.$executeRaw`
          INSERT INTO lesson_chunks (id, "lessonId", "chunkIndex", heading, content, "contentHash", embedding, "embeddingModel", "createdAt")
          VALUES (${chunkId}, ${lessonId}, ${chunk.chunkIndex}, ${chunk.heading ?? null}, ${chunk.content}, ${chunk.contentHash}, ${vectorStr}::vector, ${embeddingModel}, NOW())
          ON CONFLICT ("lessonId", "chunkIndex")
          DO UPDATE SET
            heading = EXCLUDED.heading,
            content = EXCLUDED.content,
            "contentHash" = EXCLUDED."contentHash",
            embedding = EXCLUDED.embedding,
            "embeddingModel" = EXCLUDED."embeddingModel"
        `;
      } else {
        // Content changed without re-embedding? Update text columns
        await this.prisma.$executeRaw`
          UPDATE lesson_chunks
          SET heading = ${chunk.heading ?? null}, content = ${chunk.content}, "contentHash" = ${chunk.contentHash}
          WHERE "lessonId" = ${lessonId} AND "chunkIndex" = ${chunk.chunkIndex}
        `;
      }
    }

    // Delete any stale chunks beyond new count
    await this.prisma.$executeRaw`
      DELETE FROM lesson_chunks
      WHERE "lessonId" = ${lessonId} AND "chunkIndex" >= ${newChunks.length}
    `;

    return {
      chunkCount: newChunks.length,
      newCount,
      skippedCount,
    };
  }

  /**
   * Reindex all lessons in the database.
   */
  public async reindexAll(): Promise<{
    totalLessons: number;
    publishedLessons: number;
    totalChunks: number;
    newChunks: number;
    skippedChunks: number;
    errors: number;
  }> {
    const lessons = await this.prisma.lesson.findMany({
      select: { id: true, title: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    let totalChunks = 0;
    let newChunks = 0;
    let skippedChunks = 0;
    let publishedCount = 0;
    let errors = 0;

    for (const l of lessons) {
      if (l.status === 'PUBLISHED') {
        publishedCount++;
      }
      try {
        const res = await this.reindexLesson(l.id);
        totalChunks += res.chunkCount;
        newChunks += res.newCount;
        skippedChunks += res.skippedCount;
      } catch (err: any) {
        errors++;
        this.logger.error(
          `Error reindexing lesson "${l.title}" (${l.id}): ${err?.message || 'unknown error'}`,
        );
      }
    }

    return {
      totalLessons: lessons.length,
      publishedLessons: publishedCount,
      totalChunks,
      newChunks,
      skippedChunks,
      errors,
    };
  }

  private async embedWithBackoff(texts: string[]): Promise<number[][]> {
    const maxRetries = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.embeddingProvider.embedDocuments(texts);
      } catch (err: any) {
        if (attempt === maxRetries) {
          throw err;
        }
        this.logger.warn(`Embedding call failed (attempt ${attempt}): ${err.message}. Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      }
    }
    return [];
  }
}
