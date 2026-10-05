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
import type { FieldDef } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import { useAdminTopics, useCreateTopic, useUpdateTopic, useDeleteTopic } from '@/features/admin/hooks';
import type { Topic } from '@/features/admin/api';

// ─── Field definitions ─────────────────────────────────────────

const FIELDS: FieldDef[] = [
  {
    name: 'name',
    label: 'Tên chủ đề',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: Việt Nam thời kỳ phong kiến',
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    placeholder: 'viet-nam-phong-kien',
    hint: '(để trống = tự động)',
  },
  {
    name: 'description',
    label: 'Mô tả',
    type: 'textarea',
    placeholder: 'Mô tả ngắn về chủ đề...',
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

const columns = [
  nameColumn<Topic>(),
  slugColumn<Topic>(),
  statusColumn<Topic>(),
  dateColumn<Topic>(),
];

// ─── Page ──────────────────────────────────────────────────────

export default function AdminTopicsPage() {
  const resource = useAdminResource<Topic>();
  const { data, isLoading, isError } = useAdminTopics(resource.query);
  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic();
  const deleteMutation = useDeleteTopic();

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const dto = {
      name: formData.name as string,
      ...(formData.slug ? { slug: formData.slug as string } : {}),
      ...(formData.description ? { description: formData.description as string } : {}),
      status: formData.status as 'ACTIVE' | 'INACTIVE',
    };

    try {
      if (resource.editing) {
        await updateMutation.mutateAsync({ id: resource.editing.id, dto });
        toast.success('Cập nhật chủ đề thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo chủ đề thành công');
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
      toast.success(`Đã xóa chủ đề "${resource.deleteTarget.name}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  return (
    <div>
      <DataTable<Topic>
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
        entityLabel="Chủ đề"
        entityIcon="📂"
        searchPlaceholder="Tìm kiếm chủ đề..."
        onCreate={resource.openCreate}
        renderActions={actionButtons<Topic>(resource.openEdit, resource.confirmDelete)}
        idPrefix="topic"
      />

      <EntityForm<Topic>
        open={resource.modalOpen}
        entity={resource.editing}
        fields={FIELDS}
        createTitle="Thêm chủ đề"
        editTitle="Sửa chủ đề"
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Xóa chủ đề"
        message={`Bạn có chắc muốn xóa chủ đề "${resource.deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
