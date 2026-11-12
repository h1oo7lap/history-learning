import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProfilePage from './page';
import * as authHooks from '@/features/auth/hooks';

vi.mock('@/features/auth/hooks', () => ({
  useMe: vi.fn(),
  useEducationLevels: vi.fn(),
  useUpdateProfile: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/lib/upload', () => ({
  uploadImage: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authHooks, 'useEducationLevels').mockReturnValue({
      data: [
        {
          id: 'lvl-thpt',
          name: 'THPT',
          code: 'THPT',
          grades: [{ id: 'g-10', name: 'Lớp 10', code: '10' }],
        },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useEducationLevels>);
  });

  it('kết xuất skeleton khi dữ liệu đang tải (isLoading = true)', () => {
    vi.spyOn(authHooks, 'useMe').mockReturnValue({
      data: null,
      isLoading: true,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<ProfilePage />);
    expect(html).toContain('page-skeleton');
    expect(html).toContain('skeleton');
  });

  it('kết xuất avatar chữ cái đầu và nút "Đổi ảnh" khi người dùng chưa có avatar', () => {
    vi.spyOn(authHooks, 'useMe').mockReturnValue({
      data: {
        id: 'usr-1',
        fullName: 'Nguyễn Văn Sử',
        firstName: 'Sử',
        lastName: 'Nguyễn Văn',
        email: 'su@example.com',
        avatar: null,
        role: 'USER',
        gradeId: 'g-10',
        grade: { id: 'g-10', name: 'Lớp 10', code: '10' },
        totalExp: 100,
        createdAt: '2026-01-01',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<ProfilePage />);
    expect(html).toContain('NS'); // initials: N (from Nguyễn) + S (from Sử)
    expect(html).toContain('Nguyễn Văn Sử');
    expect(html).toContain('su@example.com');
    expect(html).toContain('aria-label="Tải ảnh đại diện"');
    expect(html).toContain('accept="image/jpeg,image/png,image/webp,image/gif"');
    expect(html).toContain('Đổi ảnh');
    expect(html).not.toContain('Gỡ ảnh');
  });

  it('kết xuất ảnh avatar cho phép xem rõ và nút "Gỡ ảnh" khi người dùng đã có avatar', () => {
    const avatarUrl = 'https://res.cloudinary.com/testcloud/image/upload/v1/avatar.jpg';
    vi.spyOn(authHooks, 'useMe').mockReturnValue({
      data: {
        id: 'usr-2',
        fullName: 'Trần Thị Học',
        firstName: 'Học',
        lastName: 'Trần Thị',
        email: 'hoc@example.com',
        avatar: avatarUrl,
        role: 'USER',
        gradeId: 'g-10',
        grade: { id: 'g-10', name: 'Lớp 10', code: '10' },
        totalExp: 250,
        createdAt: '2026-01-01',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof authHooks.useMe>);

    const html = renderToStaticMarkup(<ProfilePage />);
    expect(html).toContain('src="https://res.cloudinary.com/testcloud/image/upload/f_auto,q_auto,w_144/v1/avatar.jpg"');
    expect(html).toContain('Gỡ ảnh');
    expect(html).toContain('aria-label="Xem ảnh đại diện"');
    expect(html).toContain('title="Bấm để xem rõ ảnh"');
    expect(html).toContain('Đổi ảnh');
  });
});
