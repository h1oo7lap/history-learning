import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý người dùng | Admin',
};

export default function AdminUsersPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Người dùng</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Quản lý tất cả tài khoản người dùng</p>
        </div>
      </div>
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Đang được phát triển</h2>
        <p style={{ color: 'var(--muted)' }}>Tính năng quản lý người dùng sẽ ra mắt ở Week 3.</p>
      </div>
    </div>
  );
}
