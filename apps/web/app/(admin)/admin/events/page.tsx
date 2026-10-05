'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/features/admin/hooks';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { HistoricalEvent, PublishStatus } from '@/features/admin/api';
import { toast } from 'sonner';

// ─── Inline Modal component ────────────────────────────────────

interface EventFormData {
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: PublishStatus;
}

interface EventModalProps {
  open: boolean;
  event: HistoricalEvent | null; // null = create mode
  onClose: () => void;
}

function EventModal({ open, event, onClose }: EventModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();

  const [form, setForm] = useState<EventFormData>({
    name: '',
    slug: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setForm(
        event
          ? {
              name: event.name,
              slug: event.slug,
              description: event.description ?? '',
              startDate: event.startDate ? event.startDate.slice(0, 10) : '',
              endDate: event.endDate ? event.endDate.slice(0, 10) : '',
              location: event.location ?? '',
              status: event.status,
            }
          : { name: '', slug: '', description: '', startDate: '', endDate: '', location: '', status: 'ACTIVE' },
      );
      setErrors({});
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, event]);

  const validate = () => {
    const e: Partial<Record<keyof EventFormData, string>> = {};
    if (!form.name.trim()) e.name = 'Tên sự kiện không được để trống';
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      e.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
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
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      location: form.location.trim() || null,
      status: form.status,
    };

    try {
      if (event) {
        await updateMutation.mutateAsync({ id: event.id, dto });
        toast.success('Cập nhật sự kiện thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo sự kiện thành công');
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
        maxWidth: 560,
        width: '95vw',
        position: 'fixed',
        margin: 0,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-xl)', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            {event ? '✏️ Sửa sự kiện' : '➕ Thêm sự kiện'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div>
            <label className="label" htmlFor="event-name">Tên sự kiện <span style={{ color: 'var(--error)' }}>*</span></label>
            <input
              id="event-name"
              className={`input${errors.name ? ' error' : ''}`}
              placeholder="Ví dụ: Chiến thắng Bạch Đằng"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="label" htmlFor="event-slug">Slug <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(để trống = tự động)</span></label>
            <input
              id="event-slug"
              className="input"
              placeholder="chien-thang-bach-dang"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>

          {/* Start Date / End Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="event-start-date">Ngày bắt đầu</label>
              <input
                id="event-start-date"
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label" htmlFor="event-end-date">Ngày kết thúc</label>
              <input
                id="event-end-date"
                type="date"
                className={`input${errors.endDate ? ' error' : ''}`}
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
              {errors.endDate && <p className="field-error">{errors.endDate}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="label" htmlFor="event-location">Địa điểm</label>
            <input
              id="event-location"
              className="input"
              placeholder="Ví dụ: Sông Bạch Đằng, Quảng Ninh"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="event-desc">Mô tả</label>
            <textarea
              id="event-desc"
              className="input"
              rows={3}
              placeholder="Mô tả chi tiết về sự kiện lịch sử..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="label" htmlFor="event-status">Trạng thái</label>
            <select
              id="event-status"
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
              {isPending ? '⏳ Đang lưu...' : event ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminEventsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublishStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<HistoricalEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoricalEvent | null>(null);

  const { data, isLoading, isError } = useAdminEvents({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeleteEvent();

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
    setEditingEvent(null);
    setModalOpen(true);
  };

  const openEdit = (event: HistoricalEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Đã ẩn sự kiện "${deleteTarget.name}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Thao tác thất bại';
      toast.error(msg);
    }
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', margin: 0 }}>📅 Sự kiện</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Quản lý các sự kiện lịch sử
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate} id="btn-create-event">
          + Thêm sự kiện
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="🔍 Tìm kiếm sự kiện..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ maxWidth: 280, flex: '1 1 200px' }}
          id="input-search-events"
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Chưa có sự kiện nào</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.25rem' }}>
              {search ? 'Không tìm thấy kết quả. Thử từ khóa khác?' : 'Bắt đầu bằng cách thêm sự kiện đầu tiên.'}
            </p>
            {!search && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Thêm sự kiện</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Sự kiện</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Slug</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Thời gian</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Địa điểm</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--muted)' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((event, i) => (
                  <tr
                    key={event.id}
                    style={{
                      borderBottom: i < data.items.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{event.name}</div>
                      {event.description && (
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.15rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <code style={{ fontSize: '0.8rem', background: 'var(--surface-2)', padding: '0.15rem 0.4rem', borderRadius: 4, color: 'var(--brand-600)' }}>
                        {event.slug}
                      </code>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {event.startDate || event.endDate ? (
                        <div>
                          <div style={{ color: 'var(--foreground)' }}>{formatDate(event.startDate)}</div>
                          {event.endDate && event.endDate !== event.startDate && (
                            <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>→ {formatDate(event.endDate)}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem' }}>
                      {event.location ? (
                        <span style={{ color: 'var(--foreground)' }}>📍 {event.location}</span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={event.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(event)}
                          title="Sửa"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '1rem' }}
                          id={`btn-edit-${event.id}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteTarget(event)}
                          title="Ẩn (soft delete)"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '1rem', color: 'var(--error)' }}
                          id={`btn-delete-${event.id}`}
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
              Tổng cộng <strong>{data.total}</strong> sự kiện
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
      <EventModal
        open={modalOpen}
        event={editingEvent}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm Delete (soft delete) */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Ẩn sự kiện"
        message={`Bạn có chắc muốn ẩn sự kiện "${deleteTarget?.name}"? Sự kiện sẽ chuyển sang trạng thái INACTIVE và không hiển thị cho người dùng.`}
        confirmLabel="Ẩn"
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
