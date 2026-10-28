import { Injectable, Inject, Optional, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from './embedding.provider';
import {
  type Retriever,
  type RetrieveParams,
  type RetrieverResult,
  type RetrievedSegment,
} from './retriever.interface';
import { resolveEffectiveQuery } from './retrieval';
import { AI } from '@history-learning/shared';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import type { Env } from '../common/config/env.schema';

interface RawChunkRow {
  chunkId: string;
  lessonId: string;
  chunkIndex: number;
  heading: string | null;
  content: string;
  title: string;
  slug: string;
  gradeId: string;
  score: number;
  rn: bigint | number;
}

@Injectable()
export class VectorRetriever implements Retriever {
  private readonly threshold: number;
  private readonly topK = 4;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddingProvider: EmbeddingProvider,
    @Optional() private readonly configService?: ConfigService<Env>,
  ) {
    const configuredThreshold = this.configService?.get<number>('AI_SIMILARITY_THRESHOLD');
    this.threshold =
      typeof configuredThreshold === 'number' && !isNaN(configuredThreshold)
        ? configuredThreshold
        : AI.SIMILARITY_THRESHOLD ?? 0.65;
  }

  async retrieve(params: RetrieveParams): Promise<RetrieverResult> {
    const { question, history, lessonId, gradeId } = params;

    // 1. Resolve follow-up effective query (reusing existing tested helper)
    const effectiveQuery = resolveEffectiveQuery(question, history);

    // 2. Validate lessonId if given
    if (lessonId) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, status: true },
      });

      if (!lesson) {
        throw new AppError(
          ErrorCodes.LESSON_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Bài học không tồn tại',
        );
      }

      if (lesson.status !== 'PUBLISHED') {
        throw new AppError(
          ErrorCodes.LESSON_NOT_PUBLISHED,
          HttpStatus.NOT_FOUND,
          'Bài học chưa được xuất bản',
        );
      }
    }

    // 3. Generate query embedding
    const queryVector = await this.embeddingProvider.embedQuery(effectiveQuery);
    const vectorStr = `[${queryVector.join(',')}]`;

    // 4. Query pgvector
    // If gradeId is specified: only search user's grade (no cross-grade fallback).
    let rows: RawChunkRow[] = [];

    if (gradeId && !lessonId) {
      rows = await this.queryChunks(vectorStr, { gradeId, lessonId });
    } else {
      rows = await this.queryChunks(vectorStr, { gradeId: undefined, lessonId });
    }

    // 5. Filter by threshold and relative score margin from top score
    const topScore = rows[0]?.score ?? 0;
    const minRelativeScore = topScore - AI.RELATIVE_SCORE_MARGIN;

    const acceptedRows = rows.filter(
      (r) => r.score >= this.threshold && r.score >= minRelativeScore - 1e-9,
    );
    const accepted = acceptedRows.length > 0;

    if (!accepted) {
      return {
        accepted: false,
        effectiveQuery,
        segments: [],
        sources: [],
      };
    }

    const segments: RetrievedSegment[] = acceptedRows.map((r) => ({
      lessonId: r.lessonId,
      slug: r.slug,
      title: r.title,
      heading: r.heading ?? undefined,
      content: r.content,
      score: Number(r.score),
    }));

    // Deduplicate sources by lessonId
    const seenLessonIds = new Set<string>();
    const sources: Array<{ lessonId: string; title: string; slug: string }> = [];

    for (const seg of segments) {
      if (!seenLessonIds.has(seg.lessonId)) {
        seenLessonIds.add(seg.lessonId);
        sources.push({
          lessonId: seg.lessonId,
          title: seg.title,
          slug: seg.slug,
        });
      }
    }

    return {
      accepted: true,
      effectiveQuery,
      segments,
      sources,
    };
  }

  private async queryChunks(
    vectorStr: string,
    filters: { gradeId?: string; lessonId?: string },
  ): Promise<RawChunkRow[]> {
    const { gradeId, lessonId } = filters;

    // Use parameterized query with row_number partitioning to limit max 2 chunks per lesson
    const result = await this.prisma.$queryRaw<RawChunkRow[]>`
      WITH ranked AS (
        SELECT
          lc.id AS "chunkId",
          lc."lessonId",
          lc."chunkIndex",
          lc.heading,
          lc.content,
          l.title,
          l.slug,
          l."gradeId",
          (1 - (lc.embedding <=> ${vectorStr}::vector)) AS score,
          ROW_NUMBER() OVER (
            PARTITION BY lc."lessonId"
            ORDER BY lc.embedding <=> ${vectorStr}::vector ASC
          ) AS rn
        FROM lesson_chunks lc
        JOIN lessons l ON lc."lessonId" = l.id
        WHERE l.status = 'PUBLISHED'
          AND (${lessonId ?? null}::text IS NULL OR lc."lessonId" = ${lessonId})
          AND (${gradeId ?? null}::text IS NULL OR l."gradeId" = ${gradeId})
      )
      SELECT *
      FROM ranked
      WHERE rn <= 2
      ORDER BY score DESC
      LIMIT ${this.topK}
    `;

    return result.map((r) => ({
      ...r,
      score: Number(r.score),
    }));
  }
}
