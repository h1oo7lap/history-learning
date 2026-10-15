/**
 * Formatting utilities for the History Learning platform.
 */

/** Format a date to Vietnamese locale string */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString('vi-VN', options ?? {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format a relative time (e.g., "2 ngày trước") */
export function formatRelativeTime(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  const diff = new Date(date).getTime() - Date.now();
  const absDiff = Math.abs(diff);

  if (absDiff < 60_000) return 'vừa xong';
  if (absDiff < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (absDiff < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  if (absDiff < 2_592_000_000) return rtf.format(Math.round(diff / 86_400_000), 'day');
  return formatDate(date);
}

/** Format a number with Vietnamese locale */
export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

/** Format estimated time in minutes to human readable */
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

/** Truncate string with ellipsis */
export function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

/** Difficulty mapping */
export type DifficultyCode = 'EASY' | 'MEDIUM' | 'HARD';

export const DIFFICULTY_LABELS: Record<DifficultyCode | string, string> = {
  EASY: 'Cơ bản',
  MEDIUM: 'Trung bình',
  HARD: 'Nâng cao',
};

export function formatDifficulty(difficulty?: string | null): string {
  if (!difficulty) return 'Chưa xác định';
  return DIFFICULTY_LABELS[difficulty] ?? difficulty;
}

/** Format grade code/name to user-friendly label (e.g. GRADE_4 -> "Lớp 4") */
export function formatGrade(grade?: { name?: string; code?: string } | string | null): string {
  if (!grade) return '';
  if (typeof grade === 'string') {
    const match = grade.match(/\d+/);
    return match ? `Lớp ${match[0]}` : grade;
  }
  if (grade.name) return grade.name;
  if (grade.code) {
    const match = grade.code.match(/\d+/);
    return match ? `Lớp ${match[0]}` : grade.code;
  }
  return '';
}

/**
 * Tối ưu hóa URL ảnh Cloudinary: tự động định dạng WebP/AVIF (f_auto),
 * nén thông minh (q_auto) và giới hạn chiều rộng (w_<width>).
 * Giữ nguyên nếu là ảnh bên ngoài hoặc đã có transformation.
 */
export function optimizeCloudinaryUrl(url?: string | null, width = 640): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;

  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const prefix = url.slice(0, uploadIndex + 8);
  const rest = url.slice(uploadIndex + 8);

  if (rest.startsWith('f_auto') || rest.includes('f_auto,q_auto')) {
    return url;
  }

  return `${prefix}f_auto,q_auto,w_${width}/${rest}`;
}

