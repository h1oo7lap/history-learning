import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService, buildChatSystemPrompt } from './chat.service';
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

  it('I1: returns sources=[] and normalizes answer when model refusal has quotes, trailing punctuation, or markdown', async () => {
    vi.mocked(mockRetriever.retrieve).mockResolvedValue({
      accepted: true,
      effectiveQuery: 'Hỏi ngoài bài',
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

    // Variations of refusal formatting produced by LLMs
    const refusalVariations = [
      `"${AI.MODEL_REFUSAL_MESSAGE}"`,
      `*${AI.MODEL_REFUSAL_MESSAGE}.*`,
      `  "${AI.MODEL_REFUSAL_MESSAGE}."  `,
      `mình chưa tìm thấy đủ thông tin trong các bài học hiện có.`,
      `«${AI.MODEL_REFUSAL_MESSAGE}»`,
    ];

    for (const variation of refusalVariations) {
      fakeAi.setMockAnswer(variation);
      const res = await chatService.chat({ question: 'Chi tiết khác', history: [] });
      expect(res.answer).toBe(AI.MODEL_REFUSAL_MESSAGE);
      expect(res.sources).toEqual([]);
    }
  });

  it('I1: does NOT treat valid long answer containing refusal phrase in the middle as refusal', async () => {
    vi.mocked(mockRetriever.retrieve).mockResolvedValue({
      accepted: true,
      effectiveQuery: 'Số lượng cọc gỗ Bạch Đằng',
      segments: [
        {
          lessonId: 'lesson-bach-dang',
          slug: 'chien-thang-bach-dang-nam-938',
          title: 'Chiến thắng Bạch Đằng năm 938',
          content: 'Trận chiến trên sông Bạch Đằng năm 938.',
          score: 0.85,
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

    const validLongAnswer =
      'Theo tài liệu lịch sử, hiện nay mình chưa tìm thấy đủ thông tin trong các bài học hiện có để xác định số lượng chính xác từng cây cọc gỗ lim, tuy nhiên tài liệu xác nhận Ngô Quyền đã cho đẵn gỗ rừng và đóng cọc vót nhọn bịt sắt tại cửa sông hiểm yếu.';
    fakeAi.setMockAnswer(validLongAnswer);

    const res = await chatService.chat({ question: 'Có bao nhiêu cây cọc gỗ?', history: [] });

    expect(res.answer).toBe(validLongAnswer);
    expect(res.sources).toHaveLength(1);
    expect(res.sources[0]?.slug).toBe('chien-thang-bach-dang-nam-938');
  });

  it('scopes retrieval to gradeId for student but searches all grades for admin or users without gradeId', async () => {
    vi.mocked(mockRetriever.retrieve).mockResolvedValue({
      accepted: false,
      effectiveQuery: 'Test',
      segments: [],
      sources: [],
    });

    // Case 1: Student with gradeId
    await chatService.chat(
      { question: 'Câu hỏi của học sinh', history: [] },
      { id: 'student-1', gradeId: 'grade-4', role: 'USER' },
    );
    expect(mockRetriever.retrieve).toHaveBeenLastCalledWith(
      expect.objectContaining({ gradeId: 'grade-4' }),
    );

    // Case 2: Admin with gradeId -> gradeId should be undefined (all grades)
    await chatService.chat(
      { question: 'Câu hỏi của admin', history: [] },
      { id: 'admin-1', gradeId: 'grade-4', role: 'ADMIN' },
    );
    expect(mockRetriever.retrieve).toHaveBeenLastCalledWith(
      expect.objectContaining({ gradeId: undefined }),
    );

    // Case 3: User without gradeId -> gradeId undefined
    await chatService.chat(
      { question: 'Câu hỏi của khách', history: [] },
      { id: 'user-no-grade', gradeId: null, role: 'USER' },
    );
    expect(mockRetriever.retrieve).toHaveBeenLastCalledWith(
      expect.objectContaining({ gradeId: undefined }),
    );
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

  describe('buildChatSystemPrompt', () => {
    it('instructs model to answer concisely, use simple format (- and **), and omit greetings', () => {
      const prompt = buildChatSystemPrompt('Ngữ cảnh mẫu');
      expect(prompt).toContain('ngắn gọn');
      expect(prompt).toContain('KHÔNG mở đầu bằng lời chào');
      expect(prompt).toContain('**đậm**');
      expect(prompt).toContain(AI.MODEL_REFUSAL_MESSAGE);
      expect(prompt).toContain('NGỮ CẢNH BÀI HỌC:\nNgữ cảnh mẫu');
    });
  });
});
