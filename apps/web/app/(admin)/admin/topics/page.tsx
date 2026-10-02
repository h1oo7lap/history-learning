'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '@/features/admin/hooks';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { Topic, PublishStatus } from '@/features/admin/api';
import { toast } from 'sonner';

// ─── Inline Modal component ────────────────────────────────────

interface TopicFormData {
  name: string;
  slug: string;
  description: string;
  status: PublishStatus;
}

interface TopicModalProps {
  open: boolean;
  topic: Topic | null; // null = create mode
  onClose: () => void;
}

function TopicModal({ open, topic, onClose }: TopicModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic();

  const [form, setForm] = useState<TopicFormData>({
    name: '',
    slug: '',
    description: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Partial<TopicFormData>>({});

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setForm(
        topic
          ? { name: topic.name, slug: topic.slug, description: topic.description ?? '', status: topic.status }
          : { name: '', slug: '', description: '', status: 'ACTIVE' },
      );
      setErrors({});
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, topic]);

  const validate = () => {
    const e: Partial<TopicFormData> = {};
    if (!form.name.trim()) e.name = 'Tên chủ đề không được để trống';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const dto = {
      name: form.name.trim(),
      ...(form.slug.trim() && { slug: form.slug.trim() }),
      ...(form.description.trim() && { description: form.description.trim() }),
      status: form.status,
    };

    try {
      if (topic) {
        await updateMutation.mutateAsync({ id: topic.id, dto });
        toast.success('Cập nhật chủ đề thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo chủ đề thành công');
      }
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
        maxWidth: 520,
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
            {topic ? '✏️ Sửa chủ đề' : '➕ Thêm chủ đề'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div>
            <label className="label" htmlFor="topic-name">Tên chủ đề <span style={{ color: 'var(--error)' }}>*</span></label>
            <input
              id="topic-name"
              className={`input${errors.name ? ' error' : ''}`}
              placeholder="Ví dụ: Việt Nam thời kỳ phong kiến"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="label" htmlFor="topic-slug">Slug <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(để trống = tự động)</span></label>
            <input
              id="topic-slug"
              className="input"
              placeholder="viet-nam-phong-kien"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="topic-desc">Mô tả</label>
            <textarea
              id="topic-desc"
              className="input"
              rows={3}
              placeholder="Mô tả ngắn về chủ đề..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="label" htmlFor="topic-status">Trạng thái</label>
            <select
              id="topic-status"
              className="input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PublishStatus }))}
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ẩn</option>
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={isPending} style={{ minWidth: 100 }}>
              {isPending ? '⏳ Đang lưu...' : topic ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function AdminTopicsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublishStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  const { data, isLoading, isError } = useAdminTopics({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeleteTopic();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearch(searchInput);
      setPage(1);
    }
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val as PublishStatus | '');
    setPage(1);
  };

  const openCreate = () => {
    setEditingTopic(null);
    setModalOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Đã xóa chủ đề "${deleteTarget.name}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa thất bại';
      toast.error(msg);
    }
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', margin: 0 }}>📂 Chủ đề</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Quản lý các chủ đề lịch sử
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate} id="btn-create-topic">
          + Thêm chủ đề
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="🔍 Tìm kiếm chủ đề..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ maxWidth: 280, flex: '1 1 200px' }}
          id="input-search-topics"
        />
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{ maxWidth: 160, flex: '0 0 auto' }}
          id="select-status-filter"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Hoạt động</option>
          <option value="INACTIVE">Ẩn</option>
        </select>
        {(search || statusFilter) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setSearch(''); setSearchInput(''); setStatusFilter(''); setPage(1); }}
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
            <p>Đang tải...</p>
          </div>
        ) : isError ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p>Không thể tải dữ liệu. Vui lòng thử lại.</p>
          </div>
        ) : !data?.items.length ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Chưa có chủ đề nào</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.25rem' }}>
              {search ? 'Không tìm thấy kết quả. Thử từ khóa khác?' : 'Bắt đầu bằng cách thêm chủ đề đầu tiên.'}
            </p>
            {!search && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Thêm chủ đề</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Tên</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Slug</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Ngày tạo</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--muted)' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((topic, i) => (
                  <tr
                    key={topic.id}
                    style={{
                      borderBottom: i < data.items.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{topic.name}</div>
                      {topic.description && (
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.15rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {topic.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <code style={{ fontSize: '0.8rem', background: 'var(--surface-2)', padding: '0.15rem 0.4rem', borderRadius: 4, color: 'var(--brand-600)' }}>
                        {topic.slug}
                      </code>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={topic.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(topic.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(topic)}
                          title="Sửa"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '1rem' }}
                          id={`btn-edit-${topic.id}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteTarget(topic)}
                          title="Xóa"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '1rem', color: 'var(--error)' }}
                          id={`btn-delete-${topic.id}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && (totalPages > 1 || data.total > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
              Tổng cộng <strong>{data.total}</strong> chủ đề
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
      <TopicModal
        open={modalOpen}
        topic={editingTopic}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa chủ đề"
        message={`Bạn có chắc muốn xóa chủ đề "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        dialog::backdrop { background: rgb(0 0 0 / 0.4); backdrop-filter: blur(2px); }
      `}</style>
    </div>
  );
}
