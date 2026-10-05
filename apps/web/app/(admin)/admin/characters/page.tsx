'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdminCharacters, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from '@/features/admin/hooks';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import type { Character, PublishStatus } from '@/features/admin/api';
import { toast } from 'sonner';

// ─── Inline Modal component ────────────────────────────────────

interface CharacterFormData {
  name: string;
  slug: string;
  shortDescription: string;
  biography: string;
  birthYear: string;
  deathYear: string;
  avatar: string;
  status: PublishStatus;
}

interface CharacterModalProps {
  open: boolean;
  character: Character | null; // null = create mode
  onClose: () => void;
}

function CharacterModal({ open, character, onClose }: CharacterModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const createMutation = useCreateCharacter();
  const updateMutation = useUpdateCharacter();

  const [form, setForm] = useState<CharacterFormData>({
    name: '',
    slug: '',
    shortDescription: '',
    biography: '',
    birthYear: '',
    deathYear: '',
    avatar: '',
    status: 'ACTIVE',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CharacterFormData, string>>>({});

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      setForm(
        character
          ? {
              name: character.name,
              slug: character.slug,
              shortDescription: character.shortDescription ?? '',
              biography: character.biography ?? '',
              birthYear: character.birthYear != null ? String(character.birthYear) : '',
              deathYear: character.deathYear != null ? String(character.deathYear) : '',
              avatar: character.avatar ?? '',
              status: character.status,
            }
          : { name: '', slug: '', shortDescription: '', biography: '', birthYear: '', deathYear: '', avatar: '', status: 'ACTIVE' },
      );
      setErrors({});
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open, character]);

  const validate = () => {
    const e: Partial<Record<keyof CharacterFormData, string>> = {};
    if (!form.name.trim()) e.name = 'Tên nhân vật không được để trống';
    if (form.birthYear && isNaN(Number(form.birthYear))) e.birthYear = 'Năm sinh phải là số';
    if (form.deathYear && isNaN(Number(form.deathYear))) e.deathYear = 'Năm mất phải là số';
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
      ...(form.shortDescription.trim() && { shortDescription: form.shortDescription.trim() }),
      ...(form.biography.trim() && { biography: form.biography.trim() }),
      birthYear: form.birthYear ? Number(form.birthYear) : null,
      deathYear: form.deathYear ? Number(form.deathYear) : null,
      avatar: form.avatar.trim() || null,
      status: form.status,
    };

    try {
      if (character) {
        await updateMutation.mutateAsync({ id: character.id, dto });
        toast.success('Cập nhật nhân vật thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo nhân vật thành công');
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
            {character ? '✏️ Sửa nhân vật' : '➕ Thêm nhân vật'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--muted)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Name */}
          <div>
            <label className="label" htmlFor="character-name">Tên nhân vật <span style={{ color: 'var(--error)' }}>*</span></label>
            <input
              id="character-name"
              className={`input${errors.name ? ' error' : ''}`}
              placeholder="Ví dụ: Trần Hưng Đạo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="label" htmlFor="character-slug">Slug <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(để trống = tự động)</span></label>
            <input
              id="character-slug"
              className="input"
              placeholder="tran-hung-dao"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="label" htmlFor="character-avatar">URL Ảnh đại diện</label>
            <input
              id="character-avatar"
              className="input"
              placeholder="https://example.com/avatar.jpg"
              value={form.avatar}
              onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
            />
          </div>

          {/* Birth Year / Death Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="character-birth-year">Năm sinh</label>
              <input
                id="character-birth-year"
                type="number"
                className={`input${errors.birthYear ? ' error' : ''}`}
                placeholder="Ví dụ: 1228"
                value={form.birthYear}
                onChange={(e) => setForm((f) => ({ ...f, birthYear: e.target.value }))}
              />
              {errors.birthYear && <p className="field-error">{errors.birthYear}</p>}
            </div>
            <div>
              <label className="label" htmlFor="character-death-year">Năm mất</label>
              <input
                id="character-death-year"
                type="number"
                className={`input${errors.deathYear ? ' error' : ''}`}
                placeholder="Ví dụ: 1300"
                value={form.deathYear}
                onChange={(e) => setForm((f) => ({ ...f, deathYear: e.target.value }))}
              />
              {errors.deathYear && <p className="field-error">{errors.deathYear}</p>}
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="label" htmlFor="character-short-desc">Mô tả ngắn</label>
            <input
              id="character-short-desc"
              className="input"
              placeholder="Anh hùng dân tộc, danh tướng nhà Trần"
              value={form.shortDescription}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            />
          </div>

          {/* Biography */}
          <div>
            <label className="label" htmlFor="character-bio">Tiểu sử</label>
            <textarea
              id="character-bio"
              className="input"
              rows={4}
              placeholder="Tiểu sử chi tiết về nhân vật lịch sử..."
              value={form.biography}
              onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 100 }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="label" htmlFor="character-status">Trạng thái</label>
            <select
              id="character-status"
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
              {isPending ? '⏳ Đang lưu...' : character ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

function formatYear(year: number | null): string {
  if (year == null) return '—';
  if (year < 0) return `${Math.abs(year)} TCN`;
  return String(year);
}

export default function AdminCharactersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<PublishStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);

  const { data, isLoading, isError } = useAdminCharacters({
    page,
    pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const deleteMutation = useDeleteCharacter();

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
    setEditingCharacter(null);
    setModalOpen(true);
  };

  const openEdit = (character: Character) => {
    setEditingCharacter(character);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Đã ẩn nhân vật "${deleteTarget.name}"`);
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', margin: 0 }}>🧑‍💼 Nhân vật</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Quản lý các nhân vật lịch sử
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate} id="btn-create-character">
          + Thêm nhân vật
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="🔍 Tìm kiếm nhân vật..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ maxWidth: 280, flex: '1 1 200px' }}
          id="input-search-characters"
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧑‍💼</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Chưa có nhân vật nào</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.25rem' }}>
              {search ? 'Không tìm thấy kết quả. Thử từ khóa khác?' : 'Bắt đầu bằng cách thêm nhân vật đầu tiên.'}
            </p>
            {!search && (
              <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Thêm nhân vật</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Nhân vật</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Slug</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Năm sinh – mất</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Trạng thái</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Ngày tạo</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--muted)' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((character, i) => (
                  <tr
                    key={character.id}
                    style={{
                      borderBottom: i < data.items.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: character.avatar ? `url(${character.avatar}) center/cover` : 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
                          flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.9rem', color: '#fff', fontWeight: 700,
                        }}>
                          {!character.avatar && character.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{character.name}</div>
                          {character.shortDescription && (
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.1rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {character.shortDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <code style={{ fontSize: '0.8rem', background: 'var(--surface-2)', padding: '0.15rem 0.4rem', borderRadius: 4, color: 'var(--brand-600)' }}>
                        {character.slug}
                      </code>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                      {character.birthYear != null || character.deathYear != null ? (
                        <span style={{ color: 'var(--foreground)' }}>
                          {formatYear(character.birthYear)} – {formatYear(character.deathYear)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <StatusBadge status={character.status} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(character.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(character)}
                          title="Sửa"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '1rem' }}
                          id={`btn-edit-${character.id}`}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteTarget(character)}
                          title="Ẩn (soft delete)"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '1rem', color: 'var(--error)' }}
                          id={`btn-delete-${character.id}`}
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
              Tổng cộng <strong>{data.total}</strong> nhân vật
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
      <CharacterModal
        open={modalOpen}
        character={editingCharacter}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm Delete (soft delete) */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Ẩn nhân vật"
        message={`Bạn có chắc muốn ẩn nhân vật "${deleteTarget?.name}"? Nhân vật sẽ chuyển sang trạng thái INACTIVE và không hiển thị cho người dùng.`}
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
