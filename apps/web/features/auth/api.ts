import { api } from '@/lib/api-client';
import type { RegisterDto, LoginDto, UpdateProfileDto } from '@history-learning/shared';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  role: 'USER' | 'ADMIN';
  gradeId: string | null;
  totalExp: number;
  status: string;
  createdAt: string;
  grade?: { id: string; name: string; code: string } | null;
}

export interface Grade {
  id: string;
  name: string;
  code: string;
  order: number;
  educationLevel?: { id: string; name: string };
}

export interface EducationLevel {
  id: string;
  name: string;
  grades: Grade[];
}

export const authApi = {
  register: (dto: RegisterDto) =>
    api.post<UserProfile>('auth/register', dto),

  login: (dto: LoginDto) =>
    api.post<{ message: string }>('auth/login', dto),

  logout: () =>
    api.post<{ message: string }>('auth/logout'),

  me: () =>
    api.get<UserProfile>('auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('auth/reset-password', { token, password }),
};

export const usersApi = {
  getMe: () =>
    api.get<UserProfile>('users/me'),

  updateMe: (dto: UpdateProfileDto) =>
    api.patch<UserProfile>('users/me', dto),

  getProgress: () =>
    api.get<unknown[]>('users/me/progress'),

  getCollection: () =>
    api.get<unknown[]>('users/me/collection'),

  getMissions: () =>
    api.get<unknown[]>('users/me/missions'),
};

export const gradesApi = {
  getAll: () =>
    api.get<Grade[]>('grades'),

  getEducationLevels: () =>
    api.get<EducationLevel[]>('education-levels'),
};
