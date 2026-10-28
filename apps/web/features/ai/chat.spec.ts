import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sliceChatHistory } from './hooks';
import { aiApi } from './api';
import { api } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  api: {
    post: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    constructor(
      public readonly errorCode: string,
      public readonly status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

describe('sliceChatHistory', () => {
  it('returns empty array when no messages provided', () => {
    expect(sliceChatHistory([])).toEqual([]);
  });

  it('preserves order and content when messages <= 4', () => {
    const messages = [
      { role: 'user' as const, content: 'Bạch Đằng diễn ra năm nào?' },
      { role: 'model' as const, content: 'Trận Bạch Đằng diễn ra năm 938...' },
    ];
    const sliced = sliceChatHistory(messages);
    expect(sliced).toEqual(messages);
  });

  it('slices at most 4 most recent messages when history exceeds 4', () => {
    const longModelAnswer = 'Nội dung rất dài của AI giữ nguyên toàn bộ ký tự... '.repeat(20);
    const messages = [
      { role: 'user' as const, content: 'Câu 1' },
      { role: 'model' as const, content: 'Đáp án 1' },
      { role: 'user' as const, content: 'Câu 2' },
      { role: 'model' as const, content: 'Đáp án 2' },
      { role: 'user' as const, content: 'Câu 3' },
      { role: 'model' as const, content: longModelAnswer },
    ];

    const sliced = sliceChatHistory(messages, 4);

    expect(sliced).toHaveLength(4);
    expect(sliced[0]).toEqual({ role: 'user', content: 'Câu 2' });
    expect(sliced[1]).toEqual({ role: 'model', content: 'Đáp án 2' });
    expect(sliced[2]).toEqual({ role: 'user', content: 'Câu 3' });
    expect(sliced[3]).toEqual({ role: 'model', content: longModelAnswer });
    // Model content is kept intact (server will truncate if needed)
    expect(sliced[3]?.content).toBe(longModelAnswer);
  });
});

describe('aiApi.chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls api.post with ai/chat and dto', async () => {
    const mockResponse = {
      answer: 'Chiến thắng Bạch Đằng năm 938...',
      sources: [{ lessonId: 'l1', title: 'Bạch Đằng 938', slug: 'bach-dang-938' }],
    };
    vi.mocked(api.post).mockResolvedValue(mockResponse);

    const dto = {
      question: 'Bạch Đằng năm 938?',
      history: [],
      lessonId: 'l1',
    };

    const res = await aiApi.chat(dto);
    expect(api.post).toHaveBeenCalledWith('ai/chat', dto);
    expect(res).toEqual(mockResponse);
  });
});
