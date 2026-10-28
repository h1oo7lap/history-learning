import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LessonIndexingService } from './lesson-indexing.service';
import type { EmbeddingProvider } from './embedding.provider';
import { ConfigService } from '@nestjs/config';
import { EmbeddingDiskCache } from './embedding-cache';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('LessonIndexingService (Unit)', () => {
  let service: LessonIndexingService;
  let mockPrisma: any;
  let mockEmbeddingProvider: EmbeddingProvider;
  let mockConfig: ConfigService;
  let tempCacheDir: string;

  const mockLesson = {
    id: 'lesson-1',
    title: 'Chiến thắng Bạch Đằng năm 938',
    slug: 'chien-thang-bach-dang-nam-938',
    status: 'PUBLISHED',
    content: '<p>Năm 938, Ngô Quyền đánh tan quân Nam Hán trên sông Bạch Đằng.</p>',
    contentJson: {
      version: 1,
      blocks: [
        {
          id: 'b1',
          type: 'text',
          text: '## Bối cảnh và diễn biến\n\nNăm 938, Ngô Quyền lãnh đạo quân dân đánh tan quân Nam Hán trên sông Bạch Đằng nhờ kế cắm cọc nhọn dưới lòng sông khi thủy triều lên xuống.',
        },
      ],
    },
    characters: [],
    events: [],
    grade: { id: 'grade-1', name: 'Lớp 4' },
  };

  beforeEach(() => {
    tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'indexing-service-test-'));

    mockEmbeddingProvider = {
      modelIdentifier: 'fake:mock-embedding',
      usesDiskCache: false,
      embedDocuments: vi.fn().mockResolvedValue([Array.from({ length: 768 }, () => 0.1)]),
      embedQuery: vi.fn().mockResolvedValue(Array.from({ length: 768 }, () => 0.1)),
    };

    mockPrisma = {
      lesson: {
        findUnique: vi.fn().mockResolvedValue(mockLesson),
        findMany: vi.fn(),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(1),
      $transaction: vi.fn().mockImplementation(async (cb) => cb(mockPrisma)),
    };

    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'AI_EMBEDDING_MODEL') return 'gemini-embedding-2';
        return undefined;
      }),
    } as any;

    service = new LessonIndexingService(mockPrisma, mockEmbeddingProvider, mockConfig);
    service.isAutoIndexDisabled = true;
    (service as any).diskCache = new EmbeddingDiskCache(tempCacheDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(tempCacheDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('skips chunk when contentHash AND embeddingModel match existing chunk with embedding', async () => {
    let capturedHash = '';
    mockPrisma.$executeRaw.mockImplementation(async (strings: TemplateStringsArray, ...values: any[]) => {
      const sql = strings.join('?');
      if (sql.includes('INSERT INTO lesson_chunks')) {
        capturedHash = values[5]; // contentHash parameter
      }
      return 1;
    });

    await service.reindexLesson('lesson-1');
    expect(capturedHash).toBeTruthy();

    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkIndex: 0,
        contentHash: capturedHash,
        embeddingModel: 'fake:mock-embedding',
        hasEmbedding: true,
      },
    ]);
    vi.mocked(mockEmbeddingProvider.embedDocuments).mockClear();

    const result = await service.reindexLesson('lesson-1');

    expect(result.skippedCount).toBe(1);
    expect(result.newCount).toBe(0);
    expect(mockEmbeddingProvider.embedDocuments).not.toHaveBeenCalled();
  });

  it('re-embeds chunk when contentHash matches but embeddingModel differs', async () => {
    const hash = 'sample-hash-123';
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkIndex: 0,
        contentHash: hash,
        embeddingModel: 'gemini:older-model-v1',
        hasEmbedding: true,
      },
    ]);

    const result = await service.reindexLesson('lesson-1');

    expect(result.newCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(mockEmbeddingProvider.embedDocuments).toHaveBeenCalledTimes(1);
  });

  it('re-embeds chunk when contentHash differs even if embeddingModel matches', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkIndex: 0,
        contentHash: 'stale-outdated-hash',
        embeddingModel: 'fake:mock-embedding',
        hasEmbedding: true,
      },
    ]);

    const result = await service.reindexLesson('lesson-1');

    expect(result.newCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(mockEmbeddingProvider.embedDocuments).toHaveBeenCalledTimes(1);
  });

  it('deletes chunks if lesson is not PUBLISHED', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      ...mockLesson,
      status: 'DRAFT',
    });

    const result = await service.reindexLesson('lesson-1');

    expect(result.chunkCount).toBe(0);
    expect(result.newCount).toBe(0);
    expect(result.skippedCount).toBe(0);
    expect(mockPrisma.$executeRaw).toHaveBeenCalled();
    expect(mockEmbeddingProvider.embedDocuments).not.toHaveBeenCalled();
  });

  it('f) uses disk cache-hit when provider has usesDiskCache: true', async () => {
    // Enable disk cache for this provider
    (mockEmbeddingProvider as any).usesDiskCache = true;

    // Pre-populate disk cache with expected chunk embedText
    const dimensions = 768;
    const dummyVec = Array.from({ length: dimensions }, () => 0.42);

    // Let service run once to populate or pre-seed
    const texts: string[] = [];
    vi.mocked(mockEmbeddingProvider.embedDocuments).mockImplementation(async (incoming) => {
      texts.push(...incoming);
      return [dummyVec];
    });

    // First call: cache miss, calls embedDocuments
    const res1 = await service.reindexLesson('lesson-1');
    expect(res1.newCount).toBe(1);
    expect(mockEmbeddingProvider.embedDocuments).toHaveBeenCalledTimes(1);

    const files = fs.readdirSync(tempCacheDir);
    // console.log('Files in tempCacheDir:', files);
    expect(files.length).toBeGreaterThan(0);

    // Now clear mocks and DB existing to force a fresh index
    mockPrisma.$queryRaw.mockResolvedValue([]);
    vi.mocked(mockEmbeddingProvider.embedDocuments).mockClear();

    // Second call: cache-hit on disk! embedDocuments must NOT be called
    const res2 = await service.reindexLesson('lesson-1');
    expect(res2.newCount).toBe(1);
    expect(mockEmbeddingProvider.embedDocuments).not.toHaveBeenCalled();
  });

  it('f) rejects and throws when provider returns empty or wrong-dimension vector', async () => {
    // Simulate faulty provider returning empty array []
    vi.mocked(mockEmbeddingProvider.embedDocuments).mockResolvedValue([[]]);

    await expect(service.reindexLesson('lesson-1')).rejects.toThrow(
      /nhận vector không hợp lệ/i,
    );

    // Transaction should NOT execute insert
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it('f) ensures atomic all-or-nothing transaction when DB execute fails during indexing', async () => {
    // Transaction rejects on insert
    mockPrisma.$transaction.mockRejectedValue(new Error('DB Constraint Violation'));

    await expect(service.reindexLesson('lesson-1')).rejects.toThrow('DB Constraint Violation');
  });

  it('f) calculates correct stats and tracks failed lessons in reindexAll', async () => {
    mockPrisma.lesson.findMany.mockResolvedValue([
      { id: 'l1', title: 'Bài 1', slug: 'bai-1', status: 'PUBLISHED' },
      { id: 'l2', title: 'Bài 2', slug: 'bai-2', status: 'PUBLISHED' },
      { id: 'l3', title: 'Bài 3', slug: 'bai-3', status: 'DRAFT' },
    ]);

    // Make l2 fail
    vi.spyOn(service, 'reindexLesson').mockImplementation(async (id: string) => {
      if (id === 'l2') {
        throw new Error('API Rate Limit Exceeded');
      }
      return { chunkCount: 2, newCount: 2, skippedCount: 0 };
    });

    const stats = await service.reindexAll();

    expect(stats.totalLessons).toBe(3);
    expect(stats.publishedLessons).toBe(2);
    expect(stats.totalChunks).toBe(4);
    expect(stats.newChunks).toBe(4);
    expect(stats.errors).toBe(1);
    expect(stats.failedLessons).toHaveLength(1);
    expect(stats.failedLessons[0]?.slug).toBe('bai-2');
    expect(stats.failedLessons[0]?.error).toContain('API Rate Limit Exceeded');
  });

  it('f) ensures embedding API call happens BEFORE opening transaction and passes explicit timeout options', async () => {
    const callOrder: string[] = [];

    vi.mocked(mockEmbeddingProvider.embedDocuments).mockImplementation(async (texts) => {
      callOrder.push('embedDocuments');
      return texts.map(() => Array.from({ length: 768 }, () => 0.1));
    });

    mockPrisma.$transaction.mockImplementation(async (cb: any, _options?: any) => {
      callOrder.push('transaction');
      return cb(mockPrisma);
    });

    await service.reindexLesson('lesson-1');

    // Assert call order: embedding happens strictly before transaction block opens
    expect(callOrder).toEqual(['embedDocuments', 'transaction']);

    // Assert explicit timeout options passed to $transaction
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        maxWait: 5000,
        timeout: 15000,
      }),
    );
  });
});
