'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import { useEducationLevels, useUpdateProfile, useMe } from '@/features/auth/hooks';

export function OnboardingGradeForm() {
  const router = useRouter();
  const [selectedGradeId, setSelectedGradeId] = useState<string | null>(null);
  const { data: levels, isLoading: levelsLoading } = useEducationLevels();
  const { data: user } = useMe();
  const updateProfile = useUpdateProfile();

  const handleSubmit = () => {
    if (!selectedGradeId) return;
    updateProfile.mutate(
      { gradeId: selectedGradeId },
      {
        onSuccess: () => {
          router.push('/dashboard');
        },
      },
    );
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (levelsLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-500)' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 4vw, 2rem)',
    }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 8px 24px rgb(90 114 247 / 0.35)',
          }}>
            <GraduationCap size={36} color="white" />
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, marginBottom: '0.625rem', color: 'var(--foreground)' }}>
            Bạn đang học lớp mấy?
          </h1>
          {user && (
            <p style={{ color: 'var(--muted)', fontSize: '1.0625rem' }}>
              Xin chào <strong style={{ color: 'var(--foreground)' }}>{user.fullName}</strong>!
              Hãy chọn lớp học để chúng tôi gợi ý bài học phù hợp nhất cho bạn.
            </p>
          )}
        </div>

        {/* Grade groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '2rem' }}>
          {levels?.map(level => (
            <div key={level.id} className="card" style={{ padding: '1.5rem' }}>
              {/* Level header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'var(--brand-50)', border: '1.5px solid var(--brand-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={16} color="var(--brand-500)" />
                </div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  {level.name}
                </h2>
              </div>

              {/* Grades grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '0.625rem',
              }}>
                {level.grades.map(grade => (
                  <button
                    key={grade.id}
                    id={`grade-btn-${grade.code}`}
                    onClick={() => setSelectedGradeId(grade.id)}
                    className={`grade-card${selectedGradeId === grade.id ? ' selected' : ''}`}
                  >
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedGradeId === grade.id ? 'var(--brand-600)' : 'var(--foreground)', marginBottom: '0.25rem' }}>
                      {grade.code}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {grade.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            id="onboarding-confirm-btn"
            className="btn btn-primary btn-lg btn-full"
            disabled={!selectedGradeId || updateProfile.isPending}
            onClick={handleSubmit}
          >
            {updateProfile.isPending ? (
              <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
            ) : (
              <>Xác nhận lớp học <ChevronRight size={18} /></>
            )}
          </button>

          <button
            id="onboarding-skip-btn"
            className="btn btn-ghost btn-lg btn-full"
            onClick={handleSkip}
          >
            Bỏ qua, tôi sẽ chọn sau
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
