import { api } from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────

export type PublishStatus = 'ACTIVE' | 'INACTIVE';
export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  startYear: number | null;
  endYear: number | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  name: string;
  slug: string;
  avatar: string | null;
  shortDescription: string | null;
  biography: string | null;
  birthYear: number | null;
  deathYear: number | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HistoricalEvent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  status: PublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  totalExp?: number;
  gradeId?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PublishStatus | '';
}

// ─── Topics API ────────────────────────────────────────────────

export const topicsAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<Topic>>('admin/topics', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<Topic>(`admin/topics/${id}`),

  create: (dto: { name: string; slug?: string; description?: string; status?: PublishStatus }) =>
    api.post<Topic>('admin/topics', dto),

  update: (
    id: string,
    dto: { name?: string; slug?: string; description?: string; status?: PublishStatus },
  ) => api.patch<Topic>(`admin/topics/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/topics/${id}`),
};

// ─── Periods API ───────────────────────────────────────────────

export const periodsAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<Period>>('admin/periods', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<Period>(`admin/periods/${id}`),

  create: (dto: {
    name: string;
    slug?: string;
    description?: string;
    startYear?: number | null;
    endYear?: number | null;
    status?: PublishStatus;
  }) => api.post<Period>('admin/periods', dto),

  update: (
    id: string,
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      startYear?: number | null;
      endYear?: number | null;
      status?: PublishStatus;
    },
  ) => api.patch<Period>(`admin/periods/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/periods/${id}`),
};

// ─── Characters API ────────────────────────────────────────────

export const charactersAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<Character>>('admin/characters', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<Character>(`admin/characters/${id}`),

  create: (dto: {
    name: string;
    slug?: string;
    shortDescription?: string;
    biography?: string;
    birthYear?: number | null;
    deathYear?: number | null;
    avatar?: string | null;
    status?: PublishStatus;
  }) => api.post<Character>('admin/characters', dto),

  update: (
    id: string,
    dto: {
      name?: string;
      slug?: string;
      shortDescription?: string;
      biography?: string;
      birthYear?: number | null;
      deathYear?: number | null;
      avatar?: string | null;
      status?: PublishStatus;
    },
  ) => api.patch<Character>(`admin/characters/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/characters/${id}`),
};

// ─── Events API ────────────────────────────────────────────────

export const eventsAdminApi = {
  list: (q: AdminListQuery = {}) =>
    api.get<PaginatedResult<HistoricalEvent>>('admin/events', {
      ...(q.page !== undefined && { page: q.page }),
      ...(q.pageSize !== undefined && { pageSize: q.pageSize }),
      ...(q.search && { search: q.search }),
      ...(q.status && { status: q.status }),
    }),

  getOne: (id: string) => api.get<HistoricalEvent>(`admin/events/${id}`),

  create: (dto: {
    name: string;
    slug?: string;
    description?: string;
    startDate?: string | null;
    endDate?: string | null;
    location?: string | null;
    status?: PublishStatus;
  }) => api.post<HistoricalEvent>('admin/events', dto),

  update: (
    id: string,
    dto: {
      name?: string;
      slug?: string;
      description?: string;
      startDate?: string | null;
      endDate?: string | null;
      location?: string | null;
      status?: PublishStatus;
    },
  ) => api.patch<HistoricalEvent>(`admin/events/${id}`, dto),

  delete: (id: string) => api.delete<void>(`admin/events/${id}`),
};

// ─── Admin Users API ───────────────────────────────────────────

export const usersAdminApi = {
  list: () => api.get<AdminUser[]>('admin/users'),

  getOne: (id: string) => api.get<AdminUser>(`admin/users/${id}`),

  update: (id: string, dto: { status?: UserStatus; role?: UserRole }) =>
    api.patch<AdminUser>(`admin/users/${id}`, dto),
};
