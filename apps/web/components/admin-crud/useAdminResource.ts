'use client';

import { useState, useCallback } from 'react';

/**
 * Generic state management hook for admin CRUD pages.
 * Manages page, pageSize, search, status filter, modal, and delete-confirm state
 * so each admin page only needs ~5 lines to set up all state.
 */
export function useAdminResource<T extends { id: string }>() {
  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  // Query params object for hooks
  const query = {
    page,
    pageSize,
    search: search || undefined,
    status: (statusFilter || undefined) as 'ACTIVE' | 'INACTIVE' | '' | undefined,
  };

  const openCreate = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item: T) => {
    setEditing(item);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const confirmDelete = useCallback((item: T) => {
    setDeleteTarget(item);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  return {
    // Table state
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    query,

    // Modal state
    modalOpen,
    editing,
    openCreate,
    openEdit,
    closeModal,

    // Delete state
    deleteTarget,
    confirmDelete,
    cancelDelete,
    setDeleteTarget,
  };
}
