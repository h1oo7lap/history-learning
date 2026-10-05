'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { StatusBadge } from '../admin/StatusBadge';

// ─── Types ──────────────────────────────────────────────────────

export interface ColumnDef<T> {
  key: string;
  header: string;
  /** Custom cell renderer. Falls back to item[key] */
  render?: (item: T, index: number) => ReactNode;
  /** Header alignment */
  align?: 'left' | 'center' | 'right';
  /** Minimum width */
  minWidth?: number;
  /** Don't wrap */
  nowrap?: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<T extends { id: string }> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Paginated result from server */
  data: PaginatedData<T> | undefined;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Search query */
  search: string;
  /** Status filter */
  statusFilter: string;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange: (size: number) => void;
  /** Search change handler (debounced internally) */
  onSearchChange: (search: string) => void;
  /** Status filter change handler */
  onStatusFilterChange: (status: string) => void;
  /** Optional: status filter options. Default: ACTIVE/INACTIVE */
  statusOptions?: { value: string; label: string }[];
  /** Entity label for empty states */
  entityLabel: string;
  /** Emoji icon for the entity */
  entityIcon: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** "Create" button label */
  createLabel?: string;
  /** On create click */
  onCreate?: () => void;
  /** Optional row actions renderer */
  renderActions?: (item: T) => ReactNode;
  /** Unique id prefix for testing */
  idPrefix?: string;
}

// ─── Component ──────────────────────────────────────────────────

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  isError,
  page,
  pageSize,
  search,
  statusFilter,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  statusOptions,
  entityLabel,
  entityIcon,
  searchPlaceholder,
  createLabel,
  onCreate,
  renderActions,
  idPrefix,
}: DataTableProps<T>) {
  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep searchInput in sync when parent clears search
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const handleSearchInput = useCallback(
    (val: string) => {
      setSearchInput(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearchChange(val);
        onPageChange(1);
      }, 300);
    },
    [onSearchChange, onPageChange],
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      onSearchChange(searchInput);
      onPageChange(1);
    }
  };

  const handleStatusChange = (val: string) => {
    onStatusFilterChange(val);
    onPageChange(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    onSearchChange('');
    onStatusFilterChange('');
    onPageChange(1);
  };

  const hasFilters = search || statusFilter;
  const totalPages = data?.totalPages ?? 1;
  const defaultStatusOptions = statusOptions ?? [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'INACTIVE', label: 'Ẩn' },
  ];

  const thStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--muted)',
    whiteSpace: 'nowrap',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '0.875rem 1rem',
  };



  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            {entityIcon} {entityLabel}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Quản lý {entityLabel.toLowerCase()}
          </p>
        </div>
        {onCreate && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onCreate}
            id={idPrefix ? `btn-create-${idPrefix}` : undefined}
          >
            + {createLabel ?? `Thêm ${entityLabel.toLowerCase()}`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 320 }}>
          <span style={{
            position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted)', fontSize: '0.9rem', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            className="input"
            placeholder={searchPlaceholder ?? `Tìm kiếm ${entityLabel.toLowerCase()}...`}
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            style={{ paddingLeft: '2.25rem' }}
            id={idPrefix ? `input-search-${idPrefix}` : undefined}
          />
        </div>
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          style={{ maxWidth: 180, flex: '0 0 auto' }}
          id={idPrefix ? `select-status-${idPrefix}` : undefined}
        >
          <option value="">Tất cả trạng thái</option>
          {defaultStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            ✕ Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div className="data-table-spinner" style={{
              width: 40, height: 40, margin: '0 auto 1rem',
              border: '3px solid var(--border)', borderTopColor: 'var(--brand-500)',
              borderRadius: '50%', animation: 'dt-spin 0.8s linear infinite',
            }} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : isError ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--error)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p style={{ fontWeight: 600 }}>Không thể tải dữ liệu</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Vui lòng kiểm tra kết nối và thử lại.</p>
          </div>
        ) : !data?.items.length ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>{entityIcon}</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              {search ? 'Không tìm thấy kết quả' : `Chưa có ${entityLabel.toLowerCase()} nào`}
            </h3>
            <p style={{ color: 'var(--muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              {search
                ? 'Thử thay đổi từ khóa hoặc bộ lọc.'
                : `Bắt đầu bằng cách thêm ${entityLabel.toLowerCase()} đầu tiên.`}
            </p>
            {!search && onCreate && (
              <button className="btn btn-primary btn-sm" onClick={onCreate}>
                + {createLabel ?? `Thêm ${entityLabel.toLowerCase()}`}
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        ...thStyle,
                        textAlign: col.align ?? 'left',
                        ...(col.minWidth ? { minWidth: col.minWidth } : {}),
                      }}
                    >
                      {col.header}
                    </th>
                  ))}
                  {renderActions && (
                    <th style={{ ...thStyle, textAlign: 'right' }}>Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, rowIdx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: rowIdx < data.items.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          ...tdStyle,
                          textAlign: col.align ?? 'left',
                          whiteSpace: col.nowrap ? 'nowrap' : undefined,
                        }}
                      >
                        {col.render
                          ? col.render(item, rowIdx)
                          : String((item as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                    {renderActions && (
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                          {renderActions(item)}
                        </div>
                      </td>
                    )}
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
              Tổng cộng <strong>{data.total}</strong> {entityLabel.toLowerCase()}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Hiển thị:</span>
              <input
                type="number"
                className="input"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.875rem', height: 'auto', minHeight: 'unset', width: '60px' }}
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
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
                      onPageChange(val);
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
                onClick={() => onPageChange(page - 1)}
                id={idPrefix ? `btn-prev-${idPrefix}` : 'btn-prev-page'}
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
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                id={idPrefix ? `btn-next-${idPrefix}` : 'btn-next-page'}
              >
                Tiếp →
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes dt-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Pre-built column helpers ───────────────────────────────────

/** Standard "Name + description" column */
export function nameColumn<T extends { name: string; description?: string | null }>(
  header = 'Tên',
): ColumnDef<T> {
  return {
    key: 'name',
    header,
    render: (item) => (
      <div>
        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.name}</div>
        {item.description && (
          <div style={{
            color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.15rem',
            maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.description}
          </div>
        )}
      </div>
    ),
  };
}

/** Standard "slug" column */
export function slugColumn<T extends { slug: string }>(): ColumnDef<T> {
  return {
    key: 'slug',
    header: 'Slug',
    render: (item) => (
      <code style={{
        fontSize: '0.8rem', background: 'var(--surface-2)',
        padding: '0.15rem 0.5rem', borderRadius: 4, color: 'var(--brand-600)',
      }}>
        {item.slug}
      </code>
    ),
  };
}

/** Standard "status" column */
export function statusColumn<T extends { status: string }>(): ColumnDef<T> {
  return {
    key: 'status',
    header: 'Trạng thái',
    render: (item) => <StatusBadge status={item.status} />,
  };
}

/** Standard "createdAt" column */
export function dateColumn<T>(
  key: string = 'createdAt',
  header: string = 'Ngày tạo',
): ColumnDef<T> {
  return {
    key,
    header,
    nowrap: true,
    render: (item) => (
      <span style={{ color: 'var(--muted)' }}>
        {new Date(String((item as Record<string, unknown>)[key])).toLocaleDateString('vi-VN')}
      </span>
    ),
  };
}

/** Standard action buttons (edit, delete) */
export function actionButtons<T extends { id: string }>(
  onEdit: (item: T) => void,
  onDelete: (item: T) => void,
  idPrefix?: string,
) {
  return (item: T) => (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onEdit(item)}
        title="Sửa"
        style={{ padding: '0.3rem 0.6rem', fontSize: '1rem' }}
        id={idPrefix ? `btn-edit-${item.id}` : undefined}
      >
        ✏️
      </button>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => onDelete(item)}
        title="Xóa"
        style={{ padding: '0.3rem 0.6rem', fontSize: '1rem', color: 'var(--error)' }}
        id={idPrefix ? `btn-delete-${item.id}` : undefined}
      >
        🗑️
      </button>
    </>
  );
}
