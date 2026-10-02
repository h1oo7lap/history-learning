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
