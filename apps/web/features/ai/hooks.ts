'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { aiApi, type AiChatDto, type AiChatResponseDto, type AiChatMessage } from './api';
import { isAuthError, getAiErrorMessage } from './errors';
import { authApi } from '@/features/auth/api';

/**
 * Cắt lấy tối đa 4 tin nhắn gần nhất trong lịch sử gửi lên server.
 * Tin nhắn của model giữ nguyên nội dung (server sẽ tự cắt theo giới hạn).
 */
export function sliceChatHistory(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  limit = 4,
): AiChatMessage[] {
  return messages.slice(-limit).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

export interface UseChatOptions {
  onSuccess?: (data: AiChatResponseDto) => void;
  onError?: (errorMessage: string, error: unknown) => void;
}

export function useChat(options?: UseChatOptions) {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: AiChatDto) => aiApi.chat(dto),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      if (isAuthError(error)) {
        // Xử lý 401 theo cơ chế hiện có của dự án: xóa cookie rồi chuyển về /login
        authApi
          .logout()
          .catch(() => {})
          .finally(() => {
            router.replace('/login?from=/chat');
          });
      }

      const message = getAiErrorMessage(error);
      options?.onError?.(message, error);
    },
  });
}
