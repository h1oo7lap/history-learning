import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VectorRetriever } from './vector-retriever';
import { FakeEmbeddingProvider } from './fake-embedding.provider';
import { ErrorCodes } from '../common/errors/error-codes';

describe('VectorRetriever (Unit)', () => {
  let retriever: VectorRetriever;
  let mockPrisma: any;
  let fakeEmbedder: FakeEmbeddingProvider;

  beforeEach(() => {
    fakeEmbedder = new FakeEmbeddingProvider();
    mockPrisma = {
      lesson: {
        findUnique: vi.fn(),
      },
      $queryRaw: vi.fn(),
    };
    retriever = new VectorRetriever(mockPrisma, fakeEmbedder);
  });

  it('throws 404 LESSON_NOT_FOUND when lessonId does not exist', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    await expect(
      retriever.retrieve({ question: 'Chiến thắng Bạch Đằng', lessonId: 'non-existent' }),
    ).rejects.toMatchObject({
      code: ErrorCodes.LESSON_NOT_FOUND,
      status: 404,
    });
  });

  it('throws 404 LESSON_NOT_PUBLISHED when lessonId is not PUBLISHED', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-draft',
      status: 'DRAFT',
    });

    await expect(
      retriever.retrieve({ question: 'Kháng chiến Mông Cổ', lessonId: 'lesson-draft' }),
    ).rejects.toMatchObject({
      code: ErrorCodes.LESSON_NOT_PUBLISHED,
      status: 404,
    });
  });

  it('returns accepted=false and empty sources when no chunks exceed threshold', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkId: 'c1',
        lessonId: 'l1',
        chunkIndex: 0,
        heading: 'Mở đầu',
        content: 'Nội dung không liên quan gì đến câu hỏi...',
        title: 'Bài học A',
        slug: 'bai-hoc-a',
        gradeId: 'g1',
        score: 0.25, // well below threshold 0.65
        rn: 1,
      },
    ]);

    const result = await retriever.retrieve({ question: 'Hôm nay trời đẹp không?' });
    expect(result.accepted).toBe(false);
    expect(result.segments).toEqual([]);
    expect(result.sources).toEqual([]);
  });

  it('retrieves chunks and deduplicates sources by lessonId when matching', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkId: 'c1',
        lessonId: 'l1',
        chunkIndex: 0,
        heading: '1. Bối cảnh',
        content: 'Năm 938 Ngô Quyền lãnh đạo quân dân...',
        title: 'Chiến thắng Bạch Đằng',
        slug: 'chien-thang-bach-dang',
        gradeId: 'g1',
        score: 0.85,
        rn: 1,
      },
      {
        chunkId: 'c2',
        lessonId: 'l1',
        chunkIndex: 1,
        heading: '2. Bãi cọc',
        content: 'Bãi cọc ngầm được đóng dưới lòng sông...',
        title: 'Chiến thắng Bạch Đằng',
        slug: 'chien-thang-bach-dang',
        gradeId: 'g1',
        score: 0.78,
        rn: 2,
      },
    ]);

    const result = await retriever.retrieve({ question: 'Trận Bạch Đằng năm 938' });
    expect(result.accepted).toBe(true);
    expect(result.segments.length).toBe(2);
    // Deduplicated source: 2 chunks from l1 -> 1 source entry
    expect(result.sources.length).toBe(1);
    expect(result.sources[0]).toEqual({
      lessonId: 'l1',
      title: 'Chiến thắng Bạch Đằng',
      slug: 'chien-thang-bach-dang',
    });
  });

  it('strictly scopes to gradeId without cross-grade fallback when user has gradeId', async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        chunkId: 'c_other',
        lessonId: 'l_other',
        chunkIndex: 0,
        heading: 'Khái lược',
        content: 'Nội dung lớp 4',
        title: 'Bài lớp 4',
        slug: 'bai-lop-4',
        gradeId: 'grade-4',
        score: 0.45, // < 0.65 threshold
        rn: 1,
      },
    ]);

    const result = await retriever.retrieve({
      question: 'Điện Biên Phủ diễn ra năm nào?',
      gradeId: 'grade-4',
    });

    expect(result.accepted).toBe(false);
    expect(result.segments).toEqual([]);
    expect(result.sources).toEqual([]);
    // Must only have queried once for grade-4, no second fallback query
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('filters segments by relative score margin (boundary at top - 0.10 and below)', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkId: 'c1',
        lessonId: 'l1',
        chunkIndex: 0,
        heading: 'Mục 1',
        content: 'Nội dung top 1',
        title: 'Bài 1',
        slug: 'bai-1',
        gradeId: 'g1',
        score: 0.85, // topScore
        rn: 1,
      },
      {
        chunkId: 'c2',
        lessonId: 'l1',
        chunkIndex: 1,
        heading: 'Mục 2',
        content: 'Nội dung đúng bằng top - 0.10',
        title: 'Bài 1',
        slug: 'bai-1',
        gradeId: 'g1',
        score: 0.75, // exactly topScore - 0.10 -> KEPT
        rn: 2,
      },
      {
        chunkId: 'c3',
        lessonId: 'l1',
        chunkIndex: 2,
        heading: 'Mục 3',
        content: 'Nội dung nhỏ hơn top - 0.10 một chút',
        title: 'Bài 1',
        slug: 'bai-1',
        gradeId: 'g1',
        score: 0.749, // < 0.75 -> EXCLUDED
        rn: 3,
      },
      {
        chunkId: 'c4',
        lessonId: 'l2',
        chunkIndex: 0,
        heading: 'Mục 1',
        content: 'Bài 2 có score trên threshold nhưng thấp hơn top - 0.10',
        title: 'Bài 2',
        slug: 'bai-2',
        gradeId: 'g1',
        score: 0.68, // >= 0.65 threshold but < 0.75 -> EXCLUDED
        rn: 1,
      },
    ]);

    const result = await retriever.retrieve({ question: 'Chiến thắng lịch sử' });

    expect(result.accepted).toBe(true);
    // Only c1 and c2 are kept
    expect(result.segments.map((s) => s.score)).toEqual([0.85, 0.75]);
    expect(result.segments).toHaveLength(2);
    // l2 should NOT be in sources because all its chunks were filtered out
    expect(result.sources).toEqual([
      {
        lessonId: 'l1',
        title: 'Bài 1',
        slug: 'bai-1',
      },
    ]);
  });

  it('honors AI_SIMILARITY_THRESHOLD override from ConfigService', async () => {
    const mockConfigService = {
      get: vi.fn().mockReturnValue(0.8),
    } as any;

    const customRetriever = new VectorRetriever(mockPrisma, fakeEmbedder, mockConfigService);

    // Score is 0.75: would pass default 0.65, but fails custom threshold 0.8
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        chunkId: 'c1',
        lessonId: 'l1',
        chunkIndex: 0,
        heading: 'Nội dung',
        content: 'Nội dung bài học',
        title: 'Bài học 1',
        slug: 'bai-hoc-1',
        gradeId: 'g1',
        score: 0.75,
        rn: 1,
      },
    ]);

    const result = await customRetriever.retrieve({
      question: 'Chiến thắng Bạch Đằng',
    });

    expect(result.accepted).toBe(false);
    expect(result.segments).toHaveLength(0);
  });
});
