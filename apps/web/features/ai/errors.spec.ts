import { describe, it, expect } from 'vitest';
import { getAiErrorMessage, isAuthError } from './errors';
import { ApiClientError } from '@/lib/api-client';

describe('getAiErrorMessage', () => {
  it('maps 429 AI_RATE_LIMITED or RATE_LIMITED to a polite wait message', () => {
    const err1 = new ApiClientError('AI_RATE_LIMITED', 429, 'Rate limit exceeded');
    expect(getAiErrorMessage(err1)).toContain('quá nhanh');
    expect(getAiErrorMessage(err1)).toContain('chờ một lúc');

    const err2 = new ApiClientError('RATE_LIMITED', 429, 'Too many requests');
    expect(getAiErrorMessage(err2)).toContain('quá nhanh');
  });

  it('maps 503 AI_UNAVAILABLE to a temporary unavailable message', () => {
    const err = new ApiClientError('AI_UNAVAILABLE', 503, 'AI service unavailable');
    expect(getAiErrorMessage(err)).toBe('Dịch vụ AI tạm thời chưa sẵn sàng. Vui lòng thử lại sau.');
  });

  it('maps 404 LESSON_NOT_FOUND to friendly Vietnamese message', () => {
    const err = new ApiClientError('LESSON_NOT_FOUND', 404, 'Lesson not found');
    expect(getAiErrorMessage(err)).toBe('Không tìm thấy bài học tương ứng.');
  });

  it('maps 404 LESSON_NOT_PUBLISHED to friendly Vietnamese message', () => {
    const err = new ApiClientError('LESSON_NOT_PUBLISHED', 404, 'Lesson not published');
    expect(getAiErrorMessage(err)).toBe('Bài học này chưa được xuất bản.');
  });

  it('maps 401 UNAUTHORIZED to login expiration message', () => {
    const err = new ApiClientError('UNAUTHORIZED', 401, 'Authentication required');
    expect(getAiErrorMessage(err)).toBe(
      'Phiên đăng nhập đã hết hạn. Đang chuyển hướng về trang đăng nhập...',
    );
  });

  it('maps network fetch failures to network connection message', () => {
    const err = new TypeError('Failed to fetch');
    expect(getAiErrorMessage(err)).toBe(
      'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet của bạn.',
    );
  });

  it('never exposes raw technical details or api keys', () => {
    const sensitiveErr = new Error('GEMINI_API_KEY AIzaSyD987... failed with internal 500');
    const msg = getAiErrorMessage(sensitiveErr);
    expect(msg).not.toContain('GEMINI_API_KEY');
    expect(msg).not.toContain('AIzaSy');
    expect(msg).toBe('Đã có lỗi xảy ra khi trò chuyện với AI. Vui lòng thử lại sau.');
  });
});

describe('isAuthError', () => {
  it('returns true for 401 ApiClientError', () => {
    expect(isAuthError(new ApiClientError('UNAUTHORIZED', 401, 'Unauth'))).toBe(true);
    expect(isAuthError(new ApiClientError('OTHER', 401, 'Unauth'))).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isAuthError(new ApiClientError('AI_RATE_LIMITED', 429, 'Rate'))).toBe(false);
    expect(isAuthError(new TypeError('network error'))).toBe(false);
    expect(isAuthError(new Error('something else'))).toBe(false);
  });
});
