import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeaderboardHonorCards } from './components/LeaderboardHonorCards';
import type {
  LeaderboardEntryDto,
  LeaderboardGradeDto,
} from '@history-learning/shared';

describe('Leaderboard Components', () => {
  const mockGrade: LeaderboardGradeDto = {
    id: 'grade-6',
    name: 'Lớp 6',
    code: 'GRADE_6',
  };

  const mockEntries: LeaderboardEntryDto[] = [
    {
      rank: 1,
      userId: 'u-1',
      fullName: 'Trần Văn Nhất',
      avatar: null,
      totalExp: 1500,
      level: { id: 'lvl-5', name: 'Sử gia', displayOrder: 5, requiredExp: 1000 },
      grade: mockGrade,
      isCurrentUser: false,
    },
    {
      rank: 2,
      userId: 'u-2',
      fullName: 'Lê Thị Nhì',
      avatar: null,
      totalExp: 800,
      level: { id: 'lvl-4', name: 'Hiền tài', displayOrder: 4, requiredExp: 500 },
      grade: mockGrade,
      isCurrentUser: true,
    },
    {
      rank: 3,
      userId: 'u-3',
      fullName: 'Phạm Văn Ba',
      avatar: null,
      totalExp: 400,
      level: { id: 'lvl-3', name: 'Học giả', displayOrder: 3, requiredExp: 250 },
      grade: mockGrade,
      isCurrentUser: false,
    },
  ];

  describe('LeaderboardHonorCards (Ảnh thẻ 3 người đứng đầu)', () => {
    it('kết xuất ảnh thẻ vinh danh Quán quân, Hạng Nhì, Hạng Ba với đầy đủ thông tin', () => {
      const html = renderToStaticMarkup(<LeaderboardHonorCards top3={mockEntries} />);

      expect(html).toContain('Quán Quân');
      expect(html).toContain('Hạng Nhì');
      expect(html).toContain('Hạng Ba');
      expect(html).toContain('Trần Văn Nhất');
      expect(html).toContain('Lê Thị Nhì');
      expect(html).toContain('Phạm Văn Ba');
      expect(html).toContain('1.500 EXP');
      expect(html).toContain('Bạn'); // u-2 is current user
    });

    it('trả về null nếu danh sách top 3 rỗng', () => {
      const html = renderToStaticMarkup(<LeaderboardHonorCards top3={[]} />);
      expect(html).toBe('');
    });
  });
});
