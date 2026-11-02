import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RewardSummary } from './RewardSummary';
import { UnlockedCards } from './UnlockedCards';
import { RewardModal } from './RewardModal';

describe('RewardSummary Component', () => {
  describe('Lesson Reward', () => {
    it('hiển thị rõ +20 EXP khi hoàn thành bài học lần đầu', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="lesson"
          expGained={20}
          totalExp={20}
        />
      );
      expect(html).toContain('+20 EXP');
      expect(html).toContain('Phần thưởng hoàn thành bài học');
    });

    it('hiển thị nhân vật và sự kiện vừa mở khóa', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="lesson"
          expGained={20}
          totalExp={20}
          unlockedCharacters={[{ id: 'char-1', name: 'Ngô Quyền', slug: 'ngo-quyen' }]}
          unlockedEvents={[{ id: 'evt-1', name: 'Chiến thắng Bạch Đằng 938', slug: 'bach-dang-938' }]}
        />
      );
      expect(html).toContain('Ngô Quyền');
      expect(html).toContain('Chiến thắng Bạch Đằng 938');
      expect(html).toContain('Khám phá lịch sử mới mở khóa');
    });

    it('hiển thị thông báo thăng cấp khi leveledUp = true', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="lesson"
          expGained={20}
          totalExp={100}
          leveledUp={true}
          currentLevel={{
            id: 'lvl-2',
            name: 'Học trò Sử quán',
            displayOrder: 2,
            requiredExp: 100,
          }}
        />
      );
      expect(html).toContain('Chúc mừng bạn đã thăng cấp:');
      expect(html).toContain('Vinh danh thăng cấp');
      expect(html).toContain('Học trò Sử quán');
      expect(html).toContain('(Cấp 2)');
    });

    it('hỗ trợ variant="modal" với định dạng tập trung cho overlay', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="lesson"
          variant="modal"
          expGained={20}
          totalExp={20}
        />
      );
      expect(html).toContain('+20 EXP');
      expect(html).toContain('Điểm kinh nghiệm hoàn thành bài học');
    });

    it('không hiển thị (render null) khi expGained = 0 và không có thẻ mở khóa (học lại)', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="lesson"
          expGained={0}
          totalExp={20}
          unlockedCharacters={[]}
          unlockedEvents={[]}
        />
      );
      expect(html).toBe('');
    });
  });

  describe('Quiz Reward', () => {
    it('hiển thị +10 EXP khi hoàn thành quiz', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="quiz"
          expGained={10}
          totalExp={30}
        />
      );
      expect(html).toContain('+10 EXP');
      expect(html).toContain('Hoàn thành bài kiểm tra (+10 EXP)');
    });

    it('hiển thị +40 EXP kèm breakdown rõ ràng khi hoàn thành và đạt điểm chuẩn', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="quiz"
          expGained={40}
          totalExp={60}
        />
      );
      expect(html).toContain('+40 EXP');
      expect(html).toContain('Hoàn thành quiz (+10 EXP) và đạt điểm chuẩn (+30 EXP)');
    });

    it('hiển thị +30 EXP khi thi lại lần đầu đạt điểm chuẩn', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="quiz"
          expGained={30}
          totalExp={50}
        />
      );
      expect(html).toContain('+30 EXP');
      expect(html).toContain('Đạt điểm chuẩn bài kiểm tra (+30 EXP)');
    });

    it('không hiển thị (render null) khi thi lại mà expGained = 0 (tránh giả lập phần thưởng)', () => {
      const html = renderToStaticMarkup(
        <RewardSummary
          type="quiz"
          expGained={0}
          totalExp={40}
        />
      );
      expect(html).toBe('');
    });
  });
});

describe('UnlockedCards Component', () => {
  it('render null khi danh sách rỗng', () => {
    const html = renderToStaticMarkup(
      <UnlockedCards characters={[]} events={[]} />
    );
    expect(html).toBe('');
  });

  it('kết xuất đúng tên thẻ nhân vật', () => {
    const html = renderToStaticMarkup(
      <UnlockedCards
        characters={[{ id: 'c1', name: 'Trần Hưng Đạo', slug: 'tran-hung-dao' }]}
      />
    );
    expect(html).toContain('Trần Hưng Đạo');
    expect(html).toContain('Thẻ nhân vật lịch sử:');
  });

  it('kết xuất đúng tên thẻ sự kiện', () => {
    const html = renderToStaticMarkup(
      <UnlockedCards
        events={[{ id: 'e1', name: 'Khởi nghĩa Hai Bà Trưng', slug: 'hai-ba-trung' }]}
      />
    );
    expect(html).toContain('Khởi nghĩa Hai Bà Trưng');
    expect(html).toContain('Thẻ sự kiện lịch sử:');
  });
});

describe('RewardModal Component', () => {
  const mockReward = {
    expGained: 20,
    totalExp: 20,
    leveledUp: false,
    currentLevel: {
      id: 'lvl-1',
      name: 'Tập sự Sử quán',
      displayOrder: 1,
      requiredExp: 0,
    },
    unlockedCharacters: [{ id: 'char-1', name: 'Ngô Quyền', slug: 'ngo-quyen' }],
    unlockedEvents: [{ id: 'evt-1', name: 'Chiến thắng Bạch Đằng 938', slug: 'bach-dang-938' }],
  };

  it('render null khi isOpen = false', () => {
    const html = renderToStaticMarkup(
      <RewardModal
        isOpen={false}
        onClose={vi.fn()}
        reward={mockReward}
      />
    );
    expect(html).toBe('');
  });

  it('render null khi reward không có EXP và không có thẻ (expGained = 0)', () => {
    const html = renderToStaticMarkup(
      <RewardModal
        isOpen={true}
        onClose={vi.fn()}
        reward={{
          ...mockReward,
          expGained: 0,
          unlockedCharacters: [],
          unlockedEvents: [],
        }}
      />
    );
    expect(html).toBe('');
  });

  it('kết xuất đúng cấu trúc modal: tiêu đề sách sử, +20 EXP, thẻ mở khóa và nút Tuyệt!', () => {
    const html = renderToStaticMarkup(
      <RewardModal
        isOpen={true}
        onClose={vi.fn()}
        reward={mockReward}
      />
    );
    expect(html).toContain('✦ HOÀN THÀNH BÀI HỌC ✦');
    expect(html).toContain('Chiến tích sử học');
    expect(html).toContain('+20 EXP');
    expect(html).toContain('Ngô Quyền');
    expect(html).toContain('Chiến thắng Bạch Đằng 938');
    expect(html).toContain('Tuyệt!');
  });

  it('hiển thị thông báo thăng cấp khi leveledUp = true trong modal', () => {
    const html = renderToStaticMarkup(
      <RewardModal
        isOpen={true}
        onClose={vi.fn()}
        reward={{
          ...mockReward,
          leveledUp: true,
          currentLevel: {
            id: 'lvl-2',
            name: 'Học trò Sử quán',
            displayOrder: 2,
            requiredExp: 100,
          },
        }}
      />
    );
    expect(html).toContain('Chúc mừng bạn đã thăng cấp:');
    expect(html).toContain('Vinh danh thăng cấp');
    expect(html).toContain('Học trò Sử quán');
    expect(html).toContain('(Cấp 2)');
  });
});
