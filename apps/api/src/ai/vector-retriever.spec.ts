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

  it('performs cross-grade fallback when user grade has no matches above threshold', async () => {
    // Call 1 (user grade): returns low score < 0.65
    // Call 2 (fallback all grades): returns high score >= 0.65
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        {
          chunkId: 'c_other',
          lessonId: 'l_other',
          chunkIndex: 0,
          heading: 'Khái lược',
          content: 'Nội dung lớp 4',
          title: 'Bài lớp 4',
          slug: 'bai-lop-4',
          gradeId: 'grade-4',
          score: 0.45, // < 0.65
          rn: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          chunkId: 'c_thcs',
          lessonId: 'l_thcs',
          chunkIndex: 0,
          heading: 'Diễn biến',
          content: 'Chiến dịch Điện Biên Phủ 1954',
          title: 'Chiến dịch Điện Biên Phủ',
          slug: 'chien-dich-dien-bien-phu-1954',
          gradeId: 'grade-9',
          score: 0.88, // >= 0.65
          rn: 1,
        },
      ]);

    const result = await retriever.retrieve({
      question: 'Điện Biên Phủ diễn ra năm nào?',
      gradeId: 'grade-4',
    });

    expect(result.accepted).toBe(true);
    expect(result.crossGradeFallback).toBe(true);
    expect(result.sources[0]?.slug).toBe('chien-dich-dien-bien-phu-1954');
  });
});
