'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdminUsers, useUpdateAdminUser } from '@/features/admin/hooks';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { AdminUser, UserRole, UserStatus } from '@/features/admin/api';
import { toast } from 'sonner';

// ─── Inline Modal component ────────────────────────────────────

interface UserFormData {
  role: UserRole;
  status: UserStatus;
}

interface UserModalProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
}

function UserModal({ open, user, onClose }: UserModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const updateMutation = useUpdateAdminUser();

  const [form, setForm] = useState<UserFormData>({
    role: 'USER',
    status: 'ACTIVE',
  });

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && user) {
      setForm({ role: user.role, status: user.status });
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateMutation.mutateAsync({ id: user.id, dto: form });
      toast.success('Cập nhật người dùng thành công');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã xảy ra lỗi';
      toast.error(msg);
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      style={{
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: 0,
        background: 'transparent',
        maxWidth: 440,
        width: '95vw',
        position: 'fixed',
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            ✏️ Sửa người dùng
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Tên người dùng</label>
            <input className="input" value={user?.fullName || ''} disabled style={{ opacity: 0.7 }} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
          </div>

          <div>
            <label className="label" htmlFor="user-role">Quyền (Role)</label>
            <select
              id="user-role"
              className="input"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            >
              <option value="USER">Người dùng (USER)</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
            </select>
          </div>

          <div>
            <label className="label" htmlFor="user-status">Trạng thái</label>
            <select
              id="user-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Vô hiệu hóa (INACTIVE)</option>
              <option value="BANNED">Khóa tài khoản (BANNED)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={updateMutation.isPending}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending} style={{ minWidth: 100 }}>
              {updateMutation.isPending ? '⏳ Đang lưu...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { data: users, isLoading, isError } = useAdminUsers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(1);
    }
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val as UserStatus | '');
    setPage(1);
  };

  const handleRoleChange = (val: string) => {
    setRoleFilter(val as UserRole | '');
    setPage(1);
  };

  // Client-side filtering
  let filteredUsers = users || [];
  if (search) {
    const lowerSearch = search.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.fullName.toLowerCase().includes(lowerSearch) || 
      u.email.toLowerCase().includes(lowerSearch)
    );
  }
  if (statusFilter) {
    filteredUsers = filteredUsers.filter(u => u.status === statusFilter);
  }
  if (roleFilter) {
    filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
  }

  // Derived pagination data
  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', margin: 0 }}>👥 Người dùng</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Quản lý tất cả tài khoản người dùng và quyền hạn
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="🔍 Tìm kiếm tên, email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ maxWidth: 280, flex: '1 1 200px' }}
        />
        <select
          className="input"
          value={roleFilter}
          onChange={(e) => handleRoleChange(e.target.value)}
          style={{ maxWidth: 160, flex: '0 0 auto' }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="USER">Người dùng (USER)</option>
          <option value="ADMIN">Quản trị (ADMIN)</option>
        </select>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{ maxWidth: 160, flex: '0 0 auto' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Vô hiệu hóa</option>
          <option value="BANNED">Đã khóa</option>
        </select>
        {(search || statusFilter || roleFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setRoleFilter(''); setPage(1); }}
          >
            ✕ Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : isError ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p>Không thể tải dữ liệu. Vui lòng thử lại.</p>
          </div>
        ) : !currentUsers.length ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Chưa có người dùng nào</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.25rem' }}>
              {search || statusFilter || roleFilter ? 'Không tìm thấy kết quả. Thử từ khóa khác?' : 'Danh sách hiện đang trống.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Họ tên & Email</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Vai trò</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Tổng EXP</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Ngày tham gia</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--muted)' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user, i) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < currentUsers.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{user.fullName}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                        {user.email}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <code style={{ fontSize: '0.8rem', background: user.role === 'ADMIN' ? 'rgb(239 68 68 / 0.1)' : 'var(--surface-2)', color: user.role === 'ADMIN' ? 'var(--error)' : 'var(--brand-600)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                        {user.role}
                      </code>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={user.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: 'var(--brand-600)' }}>
                      {user.totalExp ?? 0}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(user)}
                        title="Phân quyền"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '1rem' }}
                      >
                        ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {users && (totalPages > 1 || total > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
              Tổng cộng <strong>{total}</strong> người dùng
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Hiển thị:</span>
              <input
                type="number"
                className="input"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.875rem', height: 'auto', minHeight: 'unset', width: '60px' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              />
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Đến trang:</span>
                <input
                  type="number"
                  className="input"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.875rem', height: 'auto', minHeight: 'unset', width: '60px' }}
                  min={1}
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= totalPages) {
                      setPage(val);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                id="btn-prev-page"
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} style={{ display: 'flex', alignItems: 'center' }}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span style={{ padding: '0 0.25rem', color: 'var(--muted)' }}>…</span>
                    )}
                    <button
                      className={`btn btn-sm${p === page ? ' btn-primary' : ' btn-ghost'}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                id="btn-next-page"
              >
                Tiếp →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <UserModal
        open={modalOpen}
        user={editingUser}
        onClose={() => setModalOpen(false)}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        dialog::backdrop { background: rgb(0 0 0 / 0.4); backdrop-filter: blur(2px); }
      `}</style>
    </div>
  );
}
