import { api } from '@/lib/api-client';
import type {
  UserCollectionCharacterDto,
  UserCollectionEventDto,
  UserCollectionResponseDto,
} from '@history-learning/shared';

export type {
  UserCollectionCharacterDto,
  UserCollectionEventDto,
  UserCollectionResponseDto,
};

export const collectionApi = {
  /**
   * Lấy toàn bộ bộ sưu tập nhân vật và sự kiện đã mở khóa của người dùng hiện tại.
   * Yêu cầu xác thực (cookie phiên làm việc).
   */
  getMyCollection: () =>
    api.get<UserCollectionResponseDto>('users/me/collection'),
};

