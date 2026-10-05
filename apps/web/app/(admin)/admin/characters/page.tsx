'use client';

import { toast } from 'sonner';
import {
  DataTable,
  EntityForm,
  ConfirmDialog,
  slugColumn,
  statusColumn,
  dateColumn,
  actionButtons,
} from '@/components/admin-crud';
import type { FieldDef, ColumnDef } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import { useAdminCharacters, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from '@/features/admin/hooks';
import type { Character } from '@/features/admin/api';

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
    label: 'Tên nhân vật',
    type: 'text',
    required: true,
    placeholder: 'Ví dụ: Trần Hưng Đạo',
  },
  {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    placeholder: 'tran-hung-dao',
    hint: '(để trống = tự động)',
  },
  {
    name: 'avatar',
    label: 'URL Ảnh đại diện',
    type: 'url',
    placeholder: 'https://example.com/avatar.jpg',
  },
  {
    name: 'birthYear',
    label: 'Năm sinh',
    type: 'number',
    placeholder: 'Ví dụ: 1228',
    group: 'years',
  },
  {
    name: 'deathYear',
    label: 'Năm mất',
    type: 'number',
    placeholder: 'Ví dụ: 1300',
    group: 'years',
  },
  {
    name: 'shortDescription',
    label: 'Mô tả ngắn',
    type: 'text',
    placeholder: 'Anh hùng dân tộc, danh tướng nhà Trần',
  },
  {
    name: 'biography',
    label: 'Tiểu sử',
    type: 'textarea',
    placeholder: 'Tiểu sử chi tiết về nhân vật lịch sử...',
    rows: 4,
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

const characterNameColumn: ColumnDef<Character> = {
  key: 'name',
  header: 'Nhân vật',
  render: (item) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: item.avatar
          ? `url(${item.avatar}) center/cover`
          : 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.9rem', color: '#fff', fontWeight: 700,
      }}>
        {!item.avatar && item.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.name}</div>
        {item.shortDescription && (
          <div style={{
            color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.1rem',
            maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.shortDescription}
          </div>
        )}
      </div>
    </div>
  ),
};

const lifespanColumn: ColumnDef<Character> = {
  key: 'lifespan',
  header: 'Năm sinh – mất',
  nowrap: true,
  render: (item) => {
    if (item.birthYear == null && item.deathYear == null) {
      return <span style={{ color: 'var(--muted)' }}>—</span>;
    }
    return (
      <span style={{ color: 'var(--foreground)', fontSize: '0.85rem' }}>
        {formatYear(item.birthYear)} – {formatYear(item.deathYear)}
      </span>
    );
  },
};

const columns = [
  characterNameColumn,
  slugColumn<Character>(),
  lifespanColumn,
  statusColumn<Character>(),
  dateColumn<Character>(),
];

// ─── Page ──────────────────────────────────────────────────────

export default function AdminCharactersPage() {
  const resource = useAdminResource<Character>();
  const { data, isLoading, isError } = useAdminCharacters(resource.query);
  const createMutation = useCreateCharacter();
  const updateMutation = useUpdateCharacter();
  const deleteMutation = useDeleteCharacter();

  const handleSubmit = async (formData: Record<string, unknown>) => {
    const dto = {
      name: formData.name as string,
      ...(formData.slug ? { slug: formData.slug as string } : {}),
      ...(formData.shortDescription ? { shortDescription: formData.shortDescription as string } : {}),
      ...(formData.biography ? { biography: formData.biography as string } : {}),
      birthYear: formData.birthYear != null ? Number(formData.birthYear) : null,
      deathYear: formData.deathYear != null ? Number(formData.deathYear) : null,
      avatar: (formData.avatar as string) || null,
      status: formData.status as 'ACTIVE' | 'INACTIVE',
    };

    try {
      if (resource.editing) {
        await updateMutation.mutateAsync({ id: resource.editing.id, dto });
        toast.success('Cập nhật nhân vật thành công');
      } else {
        await createMutation.mutateAsync(dto);
        toast.success('Tạo nhân vật thành công');
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
      toast.success(`Đã ẩn nhân vật "${resource.deleteTarget.name}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    }
  };

  return (
    <div>
      <DataTable<Character>
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
        entityLabel="Nhân vật"
        entityIcon="🧑‍💼"
        searchPlaceholder="Tìm kiếm nhân vật..."
        onCreate={resource.openCreate}
        renderActions={actionButtons<Character>(resource.openEdit, resource.confirmDelete)}
        idPrefix="character"
      />

      <EntityForm<Character>
        open={resource.modalOpen}
        entity={resource.editing}
        fields={FIELDS}
        createTitle="Thêm nhân vật"
        editTitle="Sửa nhân vật"
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
        maxWidth={580}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Ẩn nhân vật"
        message={`Bạn có chắc muốn ẩn nhân vật "${resource.deleteTarget?.name}"? Nhân vật sẽ chuyển sang trạng thái INACTIVE.`}
        confirmLabel="Ẩn"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
