import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản Học Lịch Sử miễn phí và bắt đầu hành trình khám phá lịch sử Việt Nam.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
