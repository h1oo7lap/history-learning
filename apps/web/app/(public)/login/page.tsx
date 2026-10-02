import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào Học Lịch Sử để tiếp tục hành trình khám phá lịch sử Việt Nam.',
};

export default function LoginPage() {
  return <LoginForm />;
}
