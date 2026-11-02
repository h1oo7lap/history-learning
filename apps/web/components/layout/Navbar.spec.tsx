import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Navbar } from './Navbar';
import * as authHooks from '@/features/auth/hooks';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock auth hooks
vi.mock('@/features/auth/hooks', () => ({
  useMe: vi.fn(),
  useLogout: vi.fn(() => ({ mutate: vi.fn() })),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('kết xuất nút đăng nhập và bắt đầu học khi chưa đăng nhập (guest)', () => {
    vi.spyOn(authHooks, 'useMe').mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain('Đăng nhập');
    expect(html).toContain('Bắt đầu học');
    expect(html).not.toContain('nav-level-exp-badge');
    expect(html).not.toContain('Bộ sưu tập');
  });

  it('hiển thị Cấp độ và EXP trong pill Desktop khi người dùng đã đăng nhập (totalExp = 120)', () => {
    vi.spyOn(authHooks, 'useMe').mockReturnValue({
      data: {
        id: 'usr-1',
        fullName: 'Nguyễn Văn Sử',
        email: 'su@test.com',
        avatar: null,
        status: 'ACTIVE',
        createdAt: '2026-01-01',
        gradeId: 'g1',
        role: 'USER',
        totalExp: 120,
        grade: { id: 'g1', name: 'Lớp 10', code: '10' },
        level: {
          currentLevel: { id: 'lvl-2', name: 'Học trò', displayOrder: 2, requiredExp: 100 },
          nextLevel: { id: 'lvl-3', name: 'Học giả', displayOrder: 3, requiredExp: 250 },
          totalExp: 120,
          expInCurrentLevel: 20,
          expNeededForNextLevel: 150,
          expRemaining: 130,
          progressPercentage: 13,
          isMaxLevel: false,
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<Navbar />);
    // Badge pill desktop
    expect(html).toContain('nav-level-exp-badge');
    expect(html).toContain('Cấp 2: Học trò');
    expect(html).toContain('120 EXP');
    expect(html).toContain('Nguyễn Văn Sử');
    expect(html).toContain('Bộ sưu tập');
  });

  it('hiển thị đúng Cấp 5: Sử gia khi totalExp >= 1000', () => {
    vi.spyOn(authHooks, 'useMe').mockReturnValue({
      data: {
        id: 'usr-2',
        fullName: 'Trần Đại Sử',
        email: 'daisu@test.com',
        avatar: null,
        status: 'ACTIVE',
        createdAt: '2026-01-01',
        gradeId: null,
        role: 'USER',
        totalExp: 1250,
        level: {
          currentLevel: { id: 'lvl-5', name: 'Sử gia', displayOrder: 5, requiredExp: 1000 },
          nextLevel: null,
          totalExp: 1250,
          expInCurrentLevel: 250,
          expNeededForNextLevel: 0,
          expRemaining: 0,
          progressPercentage: 100,
          isMaxLevel: true,
        },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain('Cấp 5: Sử gia');
    expect(html).toContain('1.250 EXP');
  });
});
