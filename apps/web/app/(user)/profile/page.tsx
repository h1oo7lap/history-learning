'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, GraduationCap, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { UpdateProfileSchema } from '@history-learning/shared';
import type { UpdateProfileDto } from '@history-learning/shared';
import { useMe, useUpdateProfile, useEducationLevels } from '@/features/auth/hooks';
import { LevelProgress } from '@/components/gamification/LevelProgress';
import { uploadImage } from '@/lib/upload';
import { optimizeCloudinaryUrl } from '@/lib/format';

export default function ProfilePage() {
  const { data: user, isLoading } = useMe();
  const { data: levels } = useEducationLevels();
  const updateProfile = useUpdateProfile();
  const isAdmin = user?.role === 'ADMIN';

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingAvatar, setViewingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatarUrl = previewUrl || user?.avatar || null;

  useEffect(() => {
    if (!viewingAvatar) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingAvatar(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingAvatar]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileDto>({
    resolver: zodResolver(UpdateProfileSchema),
    resetOptions: { keepDirtyValues: true },
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

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    let localUrl: string | null = null;
    try {
      localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setUploading(true);
      setUploadProgress(0);

      const url = await uploadImage(file, {
        folder: 'avatars',
        onProgress: (pct) => setUploadProgress(pct),
      });

      await updateProfile.mutateAsync({ avatar: url });
      setPreviewUrl(null);
    } catch (err) {
      setPreviewUrl(null);
      const msg = err instanceof Error ? err.message : 'Tải ảnh đại diện thất bại';
      console.error('[AvatarUpload]', err);
      toast.error(msg);
    } finally {
      if (localUrl) URL.revokeObjectURL(localUrl);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;
    try {
      await updateProfile.mutateAsync({ avatar: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gỡ ảnh đại diện thất bại';
      toast.error(msg);
    }
  };

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
          <div
            onClick={() => {
              if (currentAvatarUrl) {
                setViewingAvatar(true);
              } else if (!uploading && !updateProfile.isPending) {
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (currentAvatarUrl) {
                  setViewingAvatar(true);
                } else if (!uploading && !updateProfile.isPending) {
                  fileInputRef.current?.click();
                }
              }
            }}
            aria-label={currentAvatarUrl ? 'Xem ảnh đại diện' : 'Tải ảnh đại diện'}
            title={currentAvatarUrl ? 'Bấm để xem rõ ảnh' : 'Bấm để tải ảnh lên'}
            style={{
              position: 'relative',
              width: 72,
              height: 72,
              flexShrink: 0,
              cursor: (uploading || updateProfile.isPending) ? 'not-allowed' : 'pointer',
              borderRadius: '50%',
              overflow: 'hidden',
            }}
          >
            {currentAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl || optimizeCloudinaryUrl(user?.avatar, 144)}
                alt={user?.fullName || 'Avatar'}
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

            {uploading && (
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.55)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  color: 'white', zIndex: 2,
                }}
              >
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <span style={{ fontSize: '0.625rem', marginTop: 2 }}>{uploadProgress}%</span>
                )}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarFileSelect}
            disabled={uploading || updateProfile.isPending}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{user?.fullName}</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || updateProfile.isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  cursor: (uploading || updateProfile.isPending) ? 'not-allowed' : 'pointer',
                }}
              >
                <Camera size={12} /> Đổi ảnh
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={uploading || updateProfile.isPending}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: '0.8rem', color: 'var(--muted)',
                    cursor: (uploading || updateProfile.isPending) ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                  }}
                  title="Gỡ ảnh đại diện"
                >
                  Gỡ ảnh
                </button>
              )}
            </div>
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

        {/* Tiến trình cấp độ và EXP */}
        {user?.level && (
          <div style={{ marginBottom: '1.5rem' }}>
            <LevelProgress level={user.level} variant="card" />
          </div>
        )}

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

      {/* Lightbox xem rõ ảnh đại diện */}
      {viewingAvatar && currentAvatarUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xem ảnh đại diện"
          onClick={() => setViewingAvatar(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: 'min(90vw, 420px)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setViewingAvatar(false)}
              aria-label="Đóng"
              style={{
                position: 'absolute',
                top: -42,
                right: 0,
                background: 'rgba(255, 255, 255, 0.25)',
                border: 'none',
                color: 'white',
                fontSize: '1.25rem',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimizeCloudinaryUrl(currentAvatarUrl, 1000)}
              alt={user?.fullName || 'Ảnh đại diện'}
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: 16,
                objectFit: 'contain',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                background: 'var(--surface)',
              }}
            />
            <div style={{ marginTop: '0.75rem', color: 'white', fontSize: '0.95rem', fontWeight: 600 }}>
              {user?.fullName}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
