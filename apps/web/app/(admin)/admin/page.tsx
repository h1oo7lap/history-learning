import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quản trị viên',
};

export default function AdminIndexPage() {
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Bảng điều khiển quản trị
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
        Quản lý nội dung và người dùng của nền tảng Học Lịch Sử.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { href: '/admin/users', icon: '👥', label: 'Người dùng' },
          { href: '/admin/topics', icon: '📂', label: 'Chủ đề' },
          { href: '/admin/periods', icon: '🕰️', label: 'Giai đoạn' },
          { href: '/admin/characters', icon: '🧑‍💼', label: 'Nhân vật' },
          { href: '/admin/events', icon: '📅', label: 'Sự kiện' },
          { href: '/admin/lessons', icon: '📖', label: 'Bài học' },
          { href: '/admin/quizzes', icon: '🧩', label: 'Quiz' },
          { href: '/admin/missions', icon: '🎯', label: 'Nhiệm vụ' },
          { href: '/admin/cards', icon: '🃏', label: 'Thẻ lịch sử' },
        ].map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            id={`admin-link-${label}`}
            className="card card-hover"
            style={{ padding: '1.5rem', textDecoration: 'none', display: 'block' }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
