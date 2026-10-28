import { api } from '@/lib/api-client';
import type {
  AiChatDto,
  AiChatResponseDto,
  AiChatMessage,
  AiSource,
} from '@history-learning/shared';

export type {
  AiChatDto,
  AiChatResponseDto,
  AiChatMessage,
  AiSource,
};

export const aiApi = {
  /**
   * Gửi câu hỏi và lịch sử hội thoại lên dịch vụ AI hỏi đáp
   */
  chat: (dto: AiChatDto) => api.post<AiChatResponseDto>('ai/chat', dto),
};
