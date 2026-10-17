'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DataTable, ConfirmDialog, actionButtons } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import {
  useAdminLessons,
  useAdminLesson,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from '@/features/admin/hooks';
import type {
  Lesson,
  CreateLessonPayload,
  UpdateLessonPayload,
  LessonStatus,
} from '@/features/admin/api';
import { lessonColumns, LessonForm } from './_components';

export default function AdminLessonsPage() {
  const resource = useAdminResource<Lesson>();

  // Extend query to support lesson-specific status filter values
  const lessonsQuery = {
    page: resource.page,
    pageSize: resource.pageSize,
    search: resource.search || undefined,
    status: (resource.statusFilter || undefined) as LessonStatus | undefined,
  };

  const { data, isLoading, isError } = useAdminLessons(lessonsQuery);
  const createMutation = useCreateLesson();
  const updateMutation = useUpdateLesson();
  const deleteMutation = useDeleteLesson();

  // Fetch full lesson detail when editing
  const [editId, setEditId] = useState<string | null>(null);
  const { data: editLesson } = useAdminLesson(editId);

  const openEditWithDetail = useCallback((item: Lesson) => {
    setEditId(item.id);
  }, []);

  // Open modal once lesson detail is loaded
  useEffect(() => {
    if (editLesson && editId) {
      resource.openEdit(editLesson);
      setEditId(null);
    }
  }, [editLesson, editId, resource]);

  const handleSubmit = async (formData: CreateLessonPayload | UpdateLessonPayload) => {
    try {
      if (resource.editing) {
        await updateMutation.mutateAsync({
          id: resource.editing.id,
          dto: formData as UpdateLessonPayload,
        });
        toast.success('Cập nhật bài học thành công');
      } else {
        await createMutation.mutateAsync(formData as CreateLessonPayload);
        toast.success('Tạo bài học thành công');
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
      toast.success(`Đã lưu trữ bài học "${resource.deleteTarget.title}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    }
  };

  return (
    <div>
      <DataTable<Lesson>
        columns={lessonColumns}
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
        statusOptions={[
          { value: 'DRAFT', label: 'Nháp' },
          { value: 'PUBLISHED', label: 'Đã xuất bản' },
          { value: 'ARCHIVED', label: 'Lưu trữ' },
        ]}
        entityLabel="Bài học"
        entityIcon="📖"
        searchPlaceholder="Tìm kiếm bài học..."
        onCreate={resource.openCreate}
        renderActions={actionButtons<Lesson>(openEditWithDetail, resource.confirmDelete)}
        idPrefix="lesson"
      />

      <LessonForm
        open={resource.modalOpen}
        lesson={resource.editing}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Lưu trữ bài học"
        message={`Bạn có chắc muốn lưu trữ bài học "${resource.deleteTarget?.title}"? Bài học sẽ chuyển sang trạng thái ARCHIVED.`}
        confirmLabel="Lưu trữ"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
