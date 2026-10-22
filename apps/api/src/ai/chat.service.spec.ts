import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service';
import { FakeAiProvider } from './fake-ai.provider';
import { AI } from '@history-learning/shared';
import { ErrorCodes } from '../common/errors/error-codes';
import type { Retriever } from './retriever.interface';

describe('ChatService (Unit)', () => {
  let chatService: ChatService;
  let mockRetriever: Retriever;
  let fakeAi: FakeAiProvider;
  let mockPrisma: any;

  beforeEach(() => {
    fakeAi = new FakeAiProvider();
    mockRetriever = {
      retrieve: vi.fn(),
    };
    mockPrisma = {
      lesson: {
        findUnique: vi.fn(),
      },
    };
    chatService = new ChatService(mockRetriever, fakeAi, mockPrisma);
  });

  it('I2: under threshold returns refusal and DOES NOT call chat model', async () => {
    const chatSpy = vi.spyOn(fakeAi, 'chat');

    vi.mocked(mockRetriever.retrieve).mockResolvedValue({
      accepted: false,
      effectiveQuery: 'Thủ đô của nước Pháp là gì?',
      segments: [],
      sources: [],
    });

    const result = await chatService.chat({
      question: 'Thủ đô của nước Pháp là gì?',
      history: [],
    });

    expect(result.answer).toBe(AI.NO_CONTEXT_REFUSAL_MESSAGE);
    expect(result.sources).toEqual([]);
    expect(chatSpy).not.toHaveBeenCalled();
  });

  it('I1: above threshold returns answer with server-attached sources', async () => {
    vi.mocked(mockRetriever.retrieve).mockResolvedValue({
      accepted: true,
      effectiveQuery: 'Chiến thắng Bạch Đằng năm 938',
      segments: [
        {
          lessonId: 'lesson-bach-dang',
          slug: 'chien-thang-bach-dang-nam-938',
          title: 'Chiến thắng Bạch Đằng năm 938',
          heading: 'Diễn biến',
          content: 'Năm 938, Ngô Quyền lãnh đạo quân dân đánh tan quân Nam Hán.',
          score: 0.88,
        },
      ],
      sources: [
        {
          lessonId: 'lesson-bach-dang',
          title: 'Chiến thắng Bạch Đằng năm 938',
          slug: 'chien-thang-bach-dang-nam-938',
        },
      ],
    });

    fakeAi.setMockAnswer('Ngô Quyền đã lãnh đạo trận đánh lịch sử trên sông Bạch Đằng.');

    const result = await chatService.chat({
      question: 'Ai chỉ huy trận Bạch Đằng năm 938?',
      history: [],
    });

    expect(result.answer).toBe('Ngô Quyền đã lãnh đạo trận đánh lịch sử trên sông Bạch Đằng.');
    expect(result.sources).toEqual([
      {
        lessonId: 'lesson-bach-dang',
        title: 'Chiến thắng Bạch Đằng năm 938',
        slug: 'chien-thang-bach-dang-nam-938',
      },
    ]);
  });

  it('I1: returns sources=[] when model refuses to answer based on context', async () => {
    vi.mocked(mockRetriever.retrieve).mockResolvedValue({
      accepted: true,
      effectiveQuery: 'Chi tiết vũ khí cọc ngầm',
      segments: [
        {
          lessonId: 'lesson-bach-dang',
          slug: 'chien-thang-bach-dang-nam-938',
          title: 'Chiến thắng Bạch Đằng năm 938',
          content: 'Trận chiến trên sông Bạch Đằng.',
          score: 0.75,
        },
      ],
      sources: [
        {
          lessonId: 'lesson-bach-dang',
          title: 'Chiến thắng Bạch Đằng năm 938',
          slug: 'chien-thang-bach-dang-nam-938',
        },
      ],
    });

    fakeAi.setMockAnswer(AI.MODEL_REFUSAL_MESSAGE);

    const result = await chatService.chat({
      question: 'Cọc gỗ nặng bao nhiêu kg?',
      history: [],
    });

    expect(result.answer).toBe(AI.MODEL_REFUSAL_MESSAGE);
    expect(result.sources).toEqual([]);
  });

  it('I3: propagates error when retrieval or embedding fails', async () => {
    vi.mocked(mockRetriever.retrieve).mockRejectedValue(
      new Error('AI embedding service failure'),
    );

    await expect(
      chatService.chat({ question: 'Chiến thắng Bạch Đằng', history: [] }),
    ).rejects.toThrow('AI embedding service failure');
  });

  it('throws 404 LESSON_NOT_FOUND if requested lessonId does not exist', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue(null);

    await expect(
      chatService.chat({
        question: 'Chiến thắng Bạch Đằng',
        history: [],
        lessonId: 'unknown-id',
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.LESSON_NOT_FOUND,
      status: 404,
    });
  });

  it('throws 404 LESSON_NOT_PUBLISHED if requested lessonId is in DRAFT', async () => {
    mockPrisma.lesson.findUnique.mockResolvedValue({
      id: 'lesson-draft',
      status: 'DRAFT',
    });

    await expect(
      chatService.chat({
        question: 'Chiến thắng Bạch Đằng',
        history: [],
        lessonId: 'lesson-draft',
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.LESSON_NOT_PUBLISHED,
      status: 404,
    });
  });
});
