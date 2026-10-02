'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi, usersApi, gradesApi } from './api';
import { ApiClientError } from '@/lib/api-client';
import type { RegisterDto, LoginDto, UpdateProfileDto } from '@history-learning/shared';

// ─── Query keys ──────────────────────────────────────────────
export const authKeys = {
  me: ['auth', 'me'] as const,
  grades: ['grades'] as const,
  educationLevels: ['education-levels'] as const,
};

// ─── Current user ─────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => usersApi.getMe(),
    retry: false,
    staleTime: 30_000,
  });
}

export function useIsAuthenticated() {
  const { data, isLoading } = useMe();
  return { user: data, isAuthenticated: !!data, isLoading };
}

// ─── Register ─────────────────────────────────────────────────
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: RegisterDto) => authApi.register(dto),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user);
      toast.success('Đăng ký thành công! Chào mừng bạn 🎉');
      router.push('/onboarding/grade');
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        if (err.errorCode === 'EMAIL_TAKEN') {
          toast.error('Email này đã được sử dụng');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Đăng ký thất bại. Vui lòng thử lại.');
      }
    },
  });
}

// ─── Login ────────────────────────────────────────────────────
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: async () => {
      // Refetch /users/me to populate auth state
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      const user = await queryClient.fetchQuery({
        queryKey: authKeys.me,
        queryFn: () => usersApi.getMe(),
      });
      toast.success('Đăng nhập thành công!');
      // Redirect to onboarding if no grade selected yet
      if (!user.gradeId) {
        router.push('/onboarding/grade');
      } else {
        router.push('/dashboard');
      }
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        if (err.errorCode === 'INVALID_CREDENTIALS') {
          toast.error('Email hoặc mật khẩu không đúng');
        } else if (err.errorCode === 'ACCOUNT_BANNED') {
          toast.error('Tài khoản của bạn đã bị khoá');
        } else if (err.errorCode === 'ACCOUNT_INACTIVE') {
          toast.error('Tài khoản chưa được kích hoạt');
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    },
  });
}

// ─── Logout ───────────────────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
      toast.success('Đã đăng xuất');
    },
    onError: () => {
      // Clear client state anyway
      queryClient.clear();
      router.push('/login');
    },
  });
}

// ─── Update profile ───────────────────────────────────────────
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => usersApi.updateMe(dto),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.me, updatedUser);
      toast.success('Cập nhật hồ sơ thành công!');
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error('Cập nhật thất bại. Vui lòng thử lại.');
      }
    },
  });
}

// ─── Forgot password ──────────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu');
    },
    onError: () => {
      toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
}

// ─── Reset password ───────────────────────────────────────────
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      router.push('/login');
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError && err.errorCode === 'INVALID_RESET_TOKEN') {
        toast.error('Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ');
      } else {
        toast.error('Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    },
  });
}

// ─── Grades ───────────────────────────────────────────────────
export function useGrades() {
  return useQuery({
    queryKey: authKeys.grades,
    queryFn: () => gradesApi.getAll(),
    staleTime: 5 * 60_000, // grades rarely change
  });
}

export function useEducationLevels() {
  return useQuery({
    queryKey: authKeys.educationLevels,
    queryFn: () => gradesApi.getEducationLevels(),
    staleTime: 5 * 60_000,
  });
}
