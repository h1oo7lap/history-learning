'use client';

import { toast } from 'sonner';
import {
  DataTable,
  EntityForm,
  ConfirmDialog,
  nameColumn,
  slugColumn,
  statusColumn,
  dateColumn,
  actionButtons,
} from '@/components/admin-crud';
import type { FieldDef, ColumnDef } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/features/admin/hooks';
import type { HistoricalEvent } from '@/features/admin/api';

// ─── Field definitions ─────────────────────────────────────────

const FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Tên sự kiện',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: Chiến thắng Bạch Đằng 938',
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    placeholder: 'chien-thang-bach-dang-938',
    hint: '(để trống = tự động)',
  },
  {
    name: 'image',
    label: 'Ảnh sự kiện',
    type: 'image',
    folder: 'events',
    hint: 'Tải ảnh lên từ máy hoặc nhập link URL',
  },
  {
    name: 'startDate',
    label: 'Ngày bắt đầu',
    type: 'date',
    group: 'dates',
  },
  {
    name: 'endDate',
    label: 'Ngày kết thúc',
    type: 'date',
    group: 'dates',
  },
  {
    name: 'location',
    label: 'Địa điểm',
    type: 'text',
    placeholder: 'Ví dụ: Sông Bạch Đằng, Quảng Ninh',
  },
  {
    name: 'description',
    label: 'Mô tả',
    type: 'textarea',
    placeholder: 'Mô tả ngắn về sự kiện lịch sử...',
    rows: 3,
  },
  {
    name: 'status',
    label: 'Trạng thái',
    type: 'select',
    options: [
      { value: 'ACTIVE', label: 'Hoạt động' },
      { value: 'INACTIVE', label: 'Ẩn' },
    ],
  },
];

// ─── Column definitions ────────────────────────────────────────

const eventNameColumn: ColumnDef<HistoricalEvent> = {
  key: 'name',
  header: 'Sự kiện',
  maxWidth: 280,
  render: (item) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: 280, minWidth: 0 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '6px',
        background: item.image
          ? `url(${item.image}) center/cover`
          : 'rgba(180, 83, 9, 0.1)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', color: '#b45309', fontWeight: 700,
        overflow: 'hidden',
        border: '1px solid var(--line, #e5e7eb)',
      }}>
        {!item.image && '📜'}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          title={item.name}
          style={{
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </div>
        {item.slug && (
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
            {item.slug}
          </div>
        )}
      </div>
    </div>
  ),
};

const locationColumn: ColumnDef<HistoricalEvent> = {
  key: 'location',
  header: 'Địa điểm',
  maxWidth: 200,
  render: (item) => (
    <span
      title={item.location || undefined}
      style={{
        color: item.location ? 'var(--foreground)' : 'var(--muted)',
        fontSize: '0.85rem',
        display: 'inline-block',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'bottom',
      }}
    >
      {item.location || '—'}
    </span>
  ),
};

const eventDateColumn: ColumnDef<HistoricalEvent> = {
  key: 'eventDate',
  header: 'Thời gian',
  nowrap: true,
  render: (item) => {
    if (!item.startDate && !item.endDate) {
      return <span style={{ color: 'var(--muted)' }}>—</span>;
    }
    const formatDate = (d: string | null) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('vi-VN');
    };
    return (
      <span style={{ color: 'var(--foreground)', fontSize: '0.85rem' }}>
        {formatDate(item.startDate)}
        {item.endDate ? ` → ${formatDate(item.endDate)}` : ''}
      </span>
    );
  },
};

const columns = [
  eventNameColumn,
  slugColumn<HistoricalEvent>(),
  eventDateColumn,
  locationColumn,
  statusColumn<HistoricalEvent>(),
  dateColumn<HistoricalEvent>(),
];

// ─── Page ──────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const resource = useAdminResource<HistoricalEvent>();
  const { data, isLoading, isError } = useAdminEvents(resource.query);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const dto = {
      name: formData.name as string,
      ...(formData.slug ? { slug: formData.slug as string } : {}),
      image: (formData.image as string) || null,
      ...(formData.description ? { description: formData.description as string } : {}),
      startDate: (formData.startDate as string) || null,
      endDate: (formData.endDate as string) || null,
      location: (formData.location as string) || null,
      status: formData.status as 'ACTIVE' | 'INACTIVE',
    };

    try {
      if (resource.editing) {
        await updateMutation.mutateAsync({ id: resource.editing.id, dto });
        toast.success('Cập nhật sự kiện thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo sự kiện thành công');
      }
      resource.closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    }
  };

  const handleDelete = async () => {
    if (!resource.deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(resource.deleteTarget.id);
      toast.success(`Đã xóa sự kiện "${resource.deleteTarget.name}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <div>
      <DataTable<HistoricalEvent>
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        page={resource.page}
        pageSize={resource.pageSize}
        search={resource.search}
        statusFilter={resource.statusFilter}
        onPageChange={resource.setPage}
        onPageSizeChange={resource.setPageSize}
        onSearchChange={resource.setSearch}
        onStatusFilterChange={resource.setStatusFilter}
        entityLabel="Sự kiện"
        entityIcon="📅"
        searchPlaceholder="Tìm kiếm sự kiện..."
        onCreate={resource.openCreate}
        renderActions={actionButtons<HistoricalEvent>(resource.openEdit, resource.confirmDelete)}
        idPrefix="event"
      />

      <EntityForm<HistoricalEvent>
        open={resource.modalOpen}
        entity={resource.editing}
        fields={FIELDS}
        createTitle="Thêm sự kiện"
        editTitle="Sửa sự kiện"
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Xóa sự kiện"
        message={`Bạn có chắc muốn xóa sự kiện "${resource.deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
