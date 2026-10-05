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
import { useAdminPeriods, useCreatePeriod, useUpdatePeriod, useDeletePeriod } from '@/features/admin/hooks';
import type { Period } from '@/features/admin/api';

// ─── Helpers ────────────────────────────────────────────────────

function formatYear(year: number | null): string {
  if (year == null) return '—';
  if (year < 0) return `${Math.abs(year)} TCN`;
  return String(year);
}

// ─── Field definitions ─────────────────────────────────────────

const FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Tên giai đoạn',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: Thời kỳ Bắc thuộc',
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    placeholder: 'thoi-ky-bac-thuoc',
    hint: '(để trống = tự động)',
  },
  {
    name: 'startYear',
    label: 'Năm bắt đầu',
    type: 'number',
    placeholder: 'Ví dụ: 111',
    group: 'years',
  },
  {
    name: 'endYear',
    label: 'Năm kết thúc',
    type: 'number',
    placeholder: 'Ví dụ: 938',
    group: 'years',
  },
  {
    name: 'description',
    label: 'Mô tả',
    type: 'textarea',
    placeholder: 'Mô tả ngắn về giai đoạn lịch sử...',
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

const yearColumn: ColumnDef<Period> = {
  key: 'years',
  header: 'Niên đại',
  nowrap: true,
  render: (item) => {
    if (item.startYear == null && item.endYear == null) {
      return <span style={{ color: 'var(--muted)' }}>—</span>;
    }
    return (
      <span style={{ color: 'var(--foreground)', fontSize: '0.85rem' }}>
        {formatYear(item.startYear)} → {formatYear(item.endYear)}
      </span>
    );
  },
};

const columns = [
  nameColumn<Period>(),
  slugColumn<Period>(),
  yearColumn,
  statusColumn<Period>(),
  dateColumn<Period>(),
];

// ─── Page ──────────────────────────────────────────────────────

export default function AdminPeriodsPage() {
  const resource = useAdminResource<Period>();
  const { data, isLoading, isError } = useAdminPeriods(resource.query);
  const createMutation = useCreatePeriod();
  const updateMutation = useUpdatePeriod();
  const deleteMutation = useDeletePeriod();

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const dto = {
      name: formData.name as string,
      ...(formData.slug ? { slug: formData.slug as string } : {}),
      ...(formData.description ? { description: formData.description as string } : {}),
      startYear: formData.startYear != null ? Number(formData.startYear) : null,
      endYear: formData.endYear != null ? Number(formData.endYear) : null,
      status: formData.status as 'ACTIVE' | 'INACTIVE',
    };

    try {
      if (resource.editing) {
        await updateMutation.mutateAsync({ id: resource.editing.id, dto });
        toast.success('Cập nhật giai đoạn thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo giai đoạn thành công');
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
      toast.success(`Đã xóa giai đoạn "${resource.deleteTarget.name}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <div>
      <DataTable<Period>
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
        entityLabel="Giai đoạn"
        entityIcon="🕰️"
        searchPlaceholder="Tìm kiếm giai đoạn..."
        onCreate={resource.openCreate}
        renderActions={actionButtons<Period>(resource.openEdit, resource.confirmDelete)}
        idPrefix="period"
      />

      <EntityForm<Period>
        open={resource.modalOpen}
        entity={resource.editing}
        fields={FIELDS}
        createTitle="Thêm giai đoạn"
        editTitle="Sửa giai đoạn"
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Xóa giai đoạn"
        message={`Bạn có chắc muốn xóa giai đoạn "${resource.deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
