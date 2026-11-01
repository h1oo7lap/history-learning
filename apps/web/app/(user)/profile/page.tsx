'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, GraduationCap, Loader2, User } from 'lucide-react';
import { UpdateProfileSchema } from '@history-learning/shared';
import type { UpdateProfileDto } from '@history-learning/shared';
import { useMe, useUpdateProfile, useEducationLevels } from '@/features/auth/hooks';

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const { data: levels } = useEducationLevels();
  const updateProfile = useUpdateProfile();
  const isAdmin = user?.role === 'ADMIN';

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileDto>({
    resolver: zodResolver(UpdateProfileSchema),
    values: {
      ...(isAdmin
        ? {
            firstName: user?.firstName ?? '',
            lastName: user?.lastName ?? '',
            fullName: user?.fullName ?? '',
            gradeId: user?.gradeId ?? null,
          }
        : {}),
      avatar: user?.avatar ?? null,
    },
  });

  if (isLoading) {
    return (
      <div className="container-page" style={{ padding: '2rem clamp(1rem,4vw,2rem)' }}>
        <div className="page-skeleton">
          {[80, 300, 200].map(w => (
            <div key={w} className="skeleton" style={{ height: 24, width: w }} />
          ))}
        </div>
      </div>
    );
  }

  const initials = user?.firstName
    ? `${user.lastName ? user.lastName[0] : ''}${user.firstName[0]}`.toUpperCase()
    : user?.fullName
      ? user.fullName.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase()
      : '?';

  // Flatten all grades
  const allGrades = levels?.flatMap(l => l.grades.map(g => ({ ...g, levelName: l.name }))) ?? [];
  const currentGrade = allGrades.find(g => g.id === user?.gradeId);
  const gradeLabel = currentGrade
    ? `${currentGrade.name} (${currentGrade.levelName})`
    : user?.grade?.name
      ? user.grade.name
      : 'Chưa chọn lớp';

  return (
    <div className="container-page" style={{ padding: 'clamp(1.5rem,4vw,2.5rem) clamp(1rem,4vw,2rem)' }}>
      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 800, marginBottom: '2rem' }}>
          Hồ sơ cá nhân
        </h1>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ position: 'relative' }}>
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.fullName}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-400), var(--brand-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: 'white',
              }}>
                {initials}
              </div>
            )}
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--surface)', border: '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Camera size={12} color="var(--muted)" />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{user?.fullName}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{user?.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.125rem 0.625rem',
                borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
                background: user?.role === 'ADMIN' ? 'rgb(239 68 68 / 0.1)' : 'var(--brand-50)',
                color: user?.role === 'ADMIN' ? 'var(--error)' : 'var(--brand-600)',
              }}>
                <User size={11} /> {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Học sinh'}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.125rem 0.625rem',
                borderRadius: 100, fontSize: '0.8rem', fontWeight: 600,
                background: 'var(--surface-2)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              }}>
                <GraduationCap size={12} /> {gradeLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(dto => updateProfile.mutate(dto))}
          className="card"
          style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          {isAdmin ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label" htmlFor="profile-lastname">Họ & tên đệm</label>
                <input
                  id="profile-lastname"
                  type="text"
                  className={`input${errors.lastName ? ' error' : ''}`}
                  placeholder="Nguyễn Văn"
                  autoComplete="family-name"
                  {...register('lastName')}
                />
                {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
              </div>
              <div>
                <label className="label" htmlFor="profile-firstname">Tên</label>
                <input
                  id="profile-firstname"
                  type="text"
                  className={`input${errors.firstName ? ' error' : ''}`}
                  placeholder="An"
                  autoComplete="given-name"
                  {...register('firstName')}
                />
                {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Họ và tên</label>
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 8,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem',
                }}
              >
                <span>{user?.fullName || '—'}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  🔒 Cố định
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
                Họ và tên học sinh được cố định theo tài khoản. Vui lòng liên hệ Quản trị viên nếu cần điều chỉnh.
              </p>
            </div>
          )}

          {isAdmin ? (
            <div>
              <label className="label" htmlFor="profile-grade">Lớp học</label>
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 8,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.625rem',
                  color: user?.gradeId ? 'var(--foreground)' : 'var(--muted)',
                  fontSize: '0.9375rem',
                }}
              >
                <span>
                  Lớp hiện tại: <strong>{gradeLabel}</strong>
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--brand-600)',
                    background: 'var(--brand-50)',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 100,
                    fontWeight: 600,
                  }}
                >
                  Đang chọn
                </span>
              </div>
              <select
                id="profile-grade"
                className="input"
                {...register('gradeId')}
              >
                <option value="">-- Đổi lớp trải nghiệm --</option>
                {allGrades.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.levelName})
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
                Tài khoản Quản trị viên có quyền thay đổi khối lớp trải nghiệm bất kỳ lúc nào.
              </p>
            </div>
          ) : (
            <div>
              <label className="label">Lớp học</label>
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 8,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: user?.gradeId ? 'var(--foreground)' : 'var(--muted)',
                  fontSize: '0.9375rem',
                }}
              >
                <span>{gradeLabel}</span>
                {user?.gradeId ? (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    🔒 Cố định
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Chưa cập nhật</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
                Khối lớp được cố định theo tài khoản học sinh. Nếu cần thay đổi, vui lòng liên hệ Quản trị viên.
              </p>
            </div>
          )}

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem', padding: '1rem', borderRadius: 10,
            background: 'var(--surface-2)',
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                Tổng EXP
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--brand-600)' }}>
                ⭐ {user?.totalExp?.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                Ngày tham gia
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
              </div>
            </div>
          </div>

          <button
            id="profile-save-btn"
            type="submit"
            className="btn btn-primary"
            disabled={!isDirty || updateProfile.isPending}
            style={{ alignSelf: 'flex-start' }}
          >
            {updateProfile.isPending ? (
              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...</>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </form>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
