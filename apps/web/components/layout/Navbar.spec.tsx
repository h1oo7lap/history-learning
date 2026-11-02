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
      },
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<Navbar />);
    // Badge pill desktop
    expect(html).toContain('nav-level-exp-badge');
    expect(html).toContain('Cấp 2: Học trò');
    expect(html).toContain('120 EXP');
    expect(html).toContain('Nguyễn Văn Sử');
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
      },
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain('Cấp 5: Sử gia');
    expect(html).toContain('1.250 EXP');
  });
});
