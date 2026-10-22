import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { EmbeddingDiskCache } from './embedding-cache';
import { LessonIndexingService } from './lesson-indexing.service';
import { FakeEmbeddingProvider } from './fake-embedding.provider';
import { ConfigService } from '@nestjs/config';

describe('EmbeddingDiskCache & Cache Isolation', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'embedding-cache-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('incorporates provider and model into the cache key', () => {
    const cache = new EmbeddingDiskCache(tempDir);
    const keyGemini = cache.getCacheKey('GeminiEmbeddingProvider', 'gemini-embedding-2', 768, 'text');
    const keyFake = cache.getCacheKey('FakeEmbeddingProvider', 'gemini-embedding-2', 768, 'text');
    const keyModel2 = cache.getCacheKey('GeminiEmbeddingProvider', 'other-model', 768, 'text');

    expect(keyGemini).not.toBe(keyFake);
    expect(keyGemini).not.toBe(keyModel2);
  });

  it('persists and retrieves vectors with provider and model correctly', () => {
    const cache = new EmbeddingDiskCache(tempDir);
    const dummyVector = [0.1, 0.2, 0.3];

    cache.set('GeminiEmbeddingProvider', 'gemini-embedding-2', 768, 'hello world', dummyVector);

    const hit = cache.get('GeminiEmbeddingProvider', 'gemini-embedding-2', 768, 'hello world');
    expect(hit).toEqual(dummyVector);

    const missDifferentProvider = cache.get('FakeEmbeddingProvider', 'gemini-embedding-2', 768, 'hello world');
    expect(missDifferentProvider).toBeNull();

    const missDifferentText = cache.get('GeminiEmbeddingProvider', 'gemini-embedding-2', 768, 'different text');
    expect(missDifferentText).toBeNull();
  });

  it('ensures FakeEmbeddingProvider never writes to or pollutes disk cache', async () => {
    const mockPrisma: any = {
      lesson: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'test-lesson',
          title: 'Chiến thắng Bạch Đằng',
          slug: 'chien-thang-bach-dang',
          status: 'PUBLISHED',
          content: 'Năm 938, Ngô Quyền cắm cọc gỗ trên sông Bạch Đằng.',
        }),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(1),
    };

    const config = new ConfigService();
    const fakeProvider = new FakeEmbeddingProvider();
    const indexingService = new LessonIndexingService(mockPrisma, fakeProvider, config);

    // Override diskCache directory to tempDir
    (indexingService as any).diskCache = new EmbeddingDiskCache(tempDir);

    await indexingService.reindexLesson('test-lesson');

    // Verify tempDir remains completely empty - fake provider must never write to disk cache
    const files = fs.readdirSync(tempDir);
    expect(files).toHaveLength(0);
  });
});
