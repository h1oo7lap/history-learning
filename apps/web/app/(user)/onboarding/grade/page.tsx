import type { Metadata } from 'next';
import { OnboardingGradeForm } from '@/features/auth/components/OnboardingGradeForm';

export const metadata: Metadata = {
  title: 'Chọn lớp học',
  description: 'Chọn lớp học để nhận gợi ý bài học phù hợp nhất.',
};

export default function OnboardingGradePage() {
  return <OnboardingGradeForm />;
}
