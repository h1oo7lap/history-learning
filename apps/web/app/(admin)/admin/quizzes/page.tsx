'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable, ConfirmDialog, actionButtons } from '@/components/admin-crud';
import { useAdminResource } from '@/components/admin-crud/useAdminResource';
import {
  useAdminQuizzes,
  useCreateQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
  useSetQuizQuestions,
} from '@/features/admin/hooks';
import type {
  AdminQuiz,
  QuizStatus,
  CreateQuizPayload,
  UpdateQuizPayload,
  QuestionPayload,
} from '@/features/admin/api';
import { quizColumns, QuizForm, type QuizTabKey } from './_components';

export default function AdminQuizzesPage() {
  const resource = useAdminResource<AdminQuiz>();
  const [initialTab, setInitialTab] = useState<QuizTabKey>('basic');

  const { data, isLoading, isError } = useAdminQuizzes({
    ...resource.query,
    status: resource.query.status as QuizStatus | '' | undefined,
  });

  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const deleteQuiz = useDeleteQuiz();
  const setQuizQuestions = useSetQuizQuestions();

  const isSaving =
    createQuiz.isPending ||
    updateQuiz.isPending ||
    setQuizQuestions.isPending;

  const handleOpenCreate = () => {
    setInitialTab('basic');
    resource.openCreate();
  };

  const handleOpenEdit = (item: AdminQuiz) => {
    setInitialTab('basic');
    resource.openEdit(item);
  };

  const handleOpenQuestions = (item: AdminQuiz) => {
    setInitialTab('questions');
    resource.openEdit(item);
  };

  const handleSubmit = async (data: {
    quizDto: CreateQuizPayload | UpdateQuizPayload;
    questions: QuestionPayload[];
  }) => {
    try {
      if (resource.editing) {
        // 1. Cập nhật thông tin quiz
        await updateQuiz.mutateAsync({
          id: resource.editing.id,
          dto: data.quizDto as UpdateQuizPayload,
        });

        // 2. Cập nhật bộ câu hỏi
        if (data.questions !== undefined) {
          await setQuizQuestions.mutateAsync({
            id: resource.editing.id,
            questions: data.questions,
          });
        }

        toast.success('Cập nhật bài quiz và bộ câu hỏi thành công!');
      } else {
        // 1. Tạo mới quiz
        const newQuiz = await createQuiz.mutateAsync(data.quizDto as CreateQuizPayload);

        // 2. Nếu có câu hỏi kèm theo, lưu luôn danh sách câu hỏi
        if (data.questions && data.questions.length > 0) {
          await setQuizQuestions.mutateAsync({
            id: newQuiz.id,
            questions: data.questions,
          });
        }

        toast.success('Tạo bài quiz mới thành công!');
      }
      resource.closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu quiz');
    }
  };

  const handleDelete = async () => {
    if (!resource.deleteTarget) return;
    try {
      await deleteQuiz.mutateAsync(resource.deleteTarget.id);
      toast.success(`Đã xoá bài quiz "${resource.deleteTarget.title}"`);
      resource.setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi xoá bài quiz');
    }
  };

  return (
    <div>
      <DataTable<AdminQuiz>
        columns={quizColumns}
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
        entityLabel="Quiz"
        entityIcon="🧩"
        searchPlaceholder="Tìm kiếm bài quiz..."
        createLabel="Tạo bài Quiz"
        onCreate={handleOpenCreate}
        renderActions={(item) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => handleOpenQuestions(item)}
              title="Quản lý câu hỏi & đáp án"
              style={{
                padding: '0.25rem 0.55rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'var(--surface-2)',
                borderRadius: 4,
              }}
            >
              <span>❓</span>
              <span>{item._count?.questions ?? item.questions?.length ?? 0} câu</span>
            </button>
            {actionButtons<AdminQuiz>(handleOpenEdit, resource.confirmDelete)(item)}
          </div>
        )}
        idPrefix="quiz"
      />

      <QuizForm
        open={resource.modalOpen}
        quiz={resource.editing}
        initialTab={initialTab}
        isPending={isSaving}
        onSubmit={handleSubmit}
        onClose={resource.closeModal}
      />

      <ConfirmDialog
        open={!!resource.deleteTarget}
        title="Xoá bài quiz?"
        message={`Bạn có chắc muốn xoá quiz "${resource.deleteTarget?.title}"? Tất cả câu hỏi, đáp án và lịch sử liên quan sẽ bị xoá.`}
        confirmLabel="Xoá quiz"
        loading={deleteQuiz.isPending}
        onConfirm={handleDelete}
        onCancel={resource.cancelDelete}
      />
    </div>
  );
}
