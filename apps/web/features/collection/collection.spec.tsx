import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  CharacterCard,
  formatLifeSpan,
} from './components/CharacterCard';
import {
  EventCard,
  formatEventDateRange,
} from './components/EventCard';
import {
  CollectionDetailModal,
  type SelectedCollectionItem,
} from './components/CollectionDetailModal';
import { CollectionPageClient } from './components/CollectionPageClient';
import * as collectionHooks from './hooks';
import type {
  UserCollectionCharacterDto,
  UserCollectionEventDto,
  UserCollectionResponseDto,
} from '@history-learning/shared';

// Mock collection hooks
vi.mock('./hooks', () => ({
  useMyCollection: vi.fn(),
  collectionKeys: {
    all: ['collection'] as const,
    me: ['collection', 'me'] as const,
  },
}));

describe('Collection Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCharacter: UserCollectionCharacterDto = {
    id: 'char-1',
    name: 'Ngô Quyền',
    slug: 'ngo-quyen',
    avatar: 'https://example.com/ngo-quyen.jpg',
    shortDescription: 'Anh hùng dân tộc đánh tan quân Nam Hán.',
    biography: 'Ngô Quyền sinh năm 898 tại Đường Lâm, Sơn Tây...',
    birthYear: 898,
    deathYear: 944,
    unlockedAt: '2026-05-10T10:00:00.000Z',
  };

  const mockEvent: UserCollectionEventDto = {
    id: 'evt-1',
    name: 'Chiến thắng Bạch Đằng 938',
    slug: 'chien-thang-bach-dang-938',
    description: 'Trận thủy chiến lịch sử trên sông Bạch Đằng đập tan mưu đồ xâm lược.',
    startDate: '0938-12-01T00:00:00.000Z',
    endDate: '0938-12-31T00:00:00.000Z',
    location: 'Sông Bạch Đằng',
    unlockedAt: '2026-05-10T10:00:00.000Z',
  };

  // =========================================================================
  // 1. Helper formatting tests
  // =========================================================================
  describe('Helper formatters', () => {
    it('formatLifeSpan: định dạng chính xác năm sinh - năm mất', () => {
      expect(formatLifeSpan(898, 944)).toBe('898 – 944');
      expect(formatLifeSpan(898, null)).toBe('Sinh năm 898');
      expect(formatLifeSpan(null, 944)).toBe('Mất năm 944');
      expect(formatLifeSpan(null, null)).toBeNull();
    });

    it('formatEventDateRange: định dạng khoảng thời gian sự kiện', () => {
      expect(formatEventDateRange('2026-01-01', '2026-01-02')).toContain('–');
      expect(formatEventDateRange('2026-01-01', '2026-01-01')).not.toContain('–');
      expect(formatEventDateRange('2026-01-01', null)).toBeTruthy();
      expect(formatEventDateRange(null, '2026-01-02')).toContain('Đến');
      expect(formatEventDateRange(null, null)).toBeNull();
    });
  });

  // =========================================================================
  // 2. CharacterCard Component
  // =========================================================================
  describe('CharacterCard Component', () => {
    it('kết xuất đầy đủ thông tin nhân vật (tên, ảnh, năm sinh - mất, tóm tắt, trạng thái)', () => {
      const html = renderToStaticMarkup(
        <CharacterCard character={mockCharacter} />
      );

      expect(html).toContain('Ngô Quyền');
      expect(html).toContain('898 – 944');
      expect(html).toContain('Anh hùng dân tộc đánh tan quân Nam Hán.');
      expect(html).toContain('Đã mở khóa');
      expect(html).toContain('alt="Ngô Quyền"');
    });

    it('hiển thị fallback chữ cái đầu khi avatar là null', () => {
      const charNoAvatar: UserCollectionCharacterDto = {
        ...mockCharacter,
        avatar: null,
      };

      const html = renderToStaticMarkup(
        <CharacterCard character={charNoAvatar} />
      );

      expect(html).toContain('data-testid="character-fallback"');
      expect(html).toContain('N');
    });
  });

  // =========================================================================
  // 3. EventCard Component
  // =========================================================================
  describe('EventCard Component', () => {
    it('kết xuất đầy đủ thông tin sự kiện (tên, thời gian, địa điểm, mô tả, trạng thái)', () => {
      const html = renderToStaticMarkup(
        <EventCard event={mockEvent} />
      );

      expect(html).toContain('Chiến thắng Bạch Đằng 938');
      expect(html).toContain('Sông Bạch Đằng');
      expect(html).toContain('Trận thủy chiến lịch sử');
      expect(html).toContain('Đã mở khóa');
    });
  });

  // =========================================================================
  // 4. CollectionDetailModal Component
  // =========================================================================
  describe('CollectionDetailModal Component', () => {
    it('trả về null khi item là null', () => {
      const html = renderToStaticMarkup(
        <CollectionDetailModal item={null} onClose={vi.fn()} />
      );
      expect(html).toBe('');
    });

    it('kết xuất chi tiết tiểu sử đầy đủ của nhân vật khi được chọn', () => {
      const selected: SelectedCollectionItem = {
        type: 'character',
        data: mockCharacter,
      };

      const html = renderToStaticMarkup(
        <CollectionDetailModal item={selected} onClose={vi.fn()} />
      );

      expect(html).toContain('Nhân vật lịch sử');
      expect(html).toContain('Ngô Quyền');
      expect(html).toContain('898 – 944');
      expect(html).toContain('Ngô Quyền sinh năm 898 tại Đường Lâm');
      expect(html).toContain('Đóng bảng chi tiết tư liệu');
    });

    it('kết xuất chi tiết sự kiện đầy đủ khi được chọn', () => {
      const selected: SelectedCollectionItem = {
        type: 'event',
        data: mockEvent,
      };

      const html = renderToStaticMarkup(
        <CollectionDetailModal item={selected} onClose={vi.fn()} />
      );

      expect(html).toContain('Sự kiện lịch sử');
      expect(html).toContain('Chiến thắng Bạch Đằng 938');
      expect(html).toContain('Sông Bạch Đằng');
      expect(html).toContain('Trận thủy chiến lịch sử trên sông Bạch Đằng');
    });
  });

  // =========================================================================
  // 5. CollectionPageClient Component (Trạng thái UI)
  // =========================================================================
  describe('CollectionPageClient Component', () => {
    it('trạng thái loading: hiển thị skeleton loader', () => {
      vi.spyOn(collectionHooks, 'useMyCollection').mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof collectionHooks.useMyCollection>);

      const html = renderToStaticMarkup(<CollectionPageClient />);

      expect(html).toContain('data-testid="collection-loading"');
      expect(html).not.toContain('data-testid="collection-empty"');
      expect(html).not.toContain('data-testid="collection-error"');
    });

    it('trạng thái error: hiển thị ErrorState và nút thử lại', () => {
      vi.spyOn(collectionHooks, 'useMyCollection').mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof collectionHooks.useMyCollection>);

      const html = renderToStaticMarkup(<CollectionPageClient />);

      expect(html).toContain('data-testid="collection-error"');
      expect(html).toContain('Không thể tải bộ sưu tập');
      expect(html).toContain('Thử lại');
    });

    it('trạng thái empty: hiển thị thông báo chưa có tư liệu nào khi totalCards = 0', () => {
      const emptyData: UserCollectionResponseDto = {
        characters: [],
        events: [],
        totalCharacters: 0,
        totalEvents: 0,
        totalCards: 0,
      };

      vi.spyOn(collectionHooks, 'useMyCollection').mockReturnValue({
        data: emptyData,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof collectionHooks.useMyCollection>);

      const html = renderToStaticMarkup(<CollectionPageClient />);

      expect(html).toContain('data-testid="collection-empty"');
      expect(html).toContain('Chưa có tư liệu nào được mở khóa.');
      expect(html).toContain('Khám phá bài học');
    });

    it('trạng thái có dữ liệu: hiển thị các tab và danh sách nhân vật đã mở khóa', () => {
      const filledData: UserCollectionResponseDto = {
        characters: [mockCharacter],
        events: [mockEvent],
        totalCharacters: 1,
        totalEvents: 1,
        totalCards: 2,
      };

      vi.spyOn(collectionHooks, 'useMyCollection').mockReturnValue({
        data: filledData,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof collectionHooks.useMyCollection>);

      const html = renderToStaticMarkup(<CollectionPageClient />);

      // Badge tổng số
      expect(html).toContain('Đã sưu tầm <strong>2</strong> tư liệu');
      // Tabs
      expect(html).toContain('Nhân vật');
      expect(html).toContain('Sự kiện');
      // Character Card xuất hiện trong tab mặc định
      expect(html).toContain('Ngô Quyền');
      expect(html).toContain('898 – 944');
    });

    it('trạng thái tab nhân vật rỗng khi chỉ có sự kiện', () => {
      const onlyEventsData: UserCollectionResponseDto = {
        characters: [],
        events: [mockEvent],
        totalCharacters: 0,
        totalEvents: 1,
        totalCards: 1,
      };

      vi.spyOn(collectionHooks, 'useMyCollection').mockReturnValue({
        data: onlyEventsData,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof collectionHooks.useMyCollection>);

      const html = renderToStaticMarkup(<CollectionPageClient />);

      expect(html).toContain('data-testid="characters-empty"');
      expect(html).toContain('Chưa có nhân vật nào được mở khóa.');
    });
  });
});

