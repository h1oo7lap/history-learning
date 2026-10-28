import { ApiClientError } from '@/lib/api-client';

/**
 * Ánh xạ lỗi từ API hoặc mạng thành thông báo tiếng Việt thân thiện với học sinh.
 * Tuyệt đối không để lộ chi tiết kỹ thuật, stack trace hay khóa API.
 */
export function getAiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (
      error.status === 429 ||
      error.errorCode === 'AI_RATE_LIMITED' ||
      error.errorCode === 'RATE_LIMITED'
    ) {
      return 'Bạn đang đặt câu hỏi quá nhanh. Vui lòng chờ một lúc rồi thử lại nhé.';
    }

    if (error.errorCode === 'AI_BUSY') {
      return 'Hệ thống đang bận, vui lòng thử lại sau ít phút.';
    }

    if (error.status === 503 || error.errorCode === 'AI_UNAVAILABLE') {
      return 'Dịch vụ AI tạm thời chưa sẵn sàng. Vui lòng thử lại sau.';
    }

    if (error.errorCode === 'LESSON_NOT_FOUND') {
      return 'Không tìm thấy bài học tương ứng.';
    }

    if (error.errorCode === 'LESSON_NOT_PUBLISHED') {
      return 'Bài học này chưa được xuất bản.';
    }

    if (error.status === 401 || error.errorCode === 'UNAUTHORIZED') {
      return 'Phiên đăng nhập đã hết hạn. Đang chuyển hướng về trang đăng nhập...';
    }

    if (error.status === 404) {
      return 'Không tìm thấy nội dung yêu cầu.';
    }
  }

  // Lỗi mạng hoặc fetch thất bại
  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet của bạn.';
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return 'Yêu cầu đã bị hủy hoặc quá thời gian chờ. Vui lòng thử lại.';
  }

  return 'Đã có lỗi xảy ra khi trò chuyện với AI. Vui lòng thử lại sau.';
}

export function isAuthError(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.status === 401 || error.errorCode === 'UNAUTHORIZED')
  );
}
