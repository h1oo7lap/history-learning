export const DEFAULT_PACING_MS = 4500;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractRetryDelayMs(err: any): number | null {
  if (!err) return null;

  // 1. Direct property retryDelay
  if (typeof err.retryDelay === 'number') {
    return err.retryDelay > 100 ? Math.ceil(err.retryDelay) : Math.ceil(err.retryDelay * 1000);
  }
  if (typeof err.retryDelay === 'string') {
    const match = err.retryDelay.match(/([\d.]+)\s*s/i);
    if (match && match[1]) return Math.ceil(parseFloat(match[1]) * 1000);
    const num = parseFloat(err.retryDelay);
    if (!isNaN(num)) return Math.ceil(num > 100 ? num : num * 1000);
  }

  // 2. Google RPC RetryInfo in details or errorDetails
  const details =
    err.details ||
    err.errorDetails ||
    err?.response?.data?.error?.details ||
    err?.error?.details;
  if (Array.isArray(details)) {
    for (const d of details) {
      if (d?.retryDelay) {
        if (typeof d.retryDelay === 'string') {
          const match = d.retryDelay.match(/([\d.]+)\s*s/i);
          if (match && match[1]) return Math.ceil(parseFloat(match[1]) * 1000);
          const num = parseFloat(d.retryDelay);
          if (!isNaN(num)) return Math.ceil(num > 100 ? num : num * 1000);
        } else if (typeof d.retryDelay === 'object') {
          const sec = Number(d.retryDelay.seconds || 0);
          const nanos = Number(d.retryDelay.nanos || 0);
          return Math.ceil(sec * 1000 + nanos / 1e6);
        }
      }
    }
  }

  // 3. HTTP Retry-After header
  const retryAfter =
    err?.response?.headers?.get?.('retry-after') ||
    err?.response?.headers?.['retry-after'] ||
    err?.headers?.['retry-after'];
  if (retryAfter) {
    const num = parseFloat(String(retryAfter));
    if (!isNaN(num)) return Math.ceil(num * 1000);
  }

  // 4. Regex in error message or error string
  const message = String(err?.message || '') + ' ' + String(err || '');
  const matchRetry =
    message.match(/retry\s+after\s+([\d.]+)\s*s?/i) ||
    message.match(/retryDelay[:\s"]+([\d.]+)\s*s?/i) ||
    message.match(/try\s+again\s+in\s+([\d.]+)\s*s?/i) ||
    message.match(/wait\s+([\d.]+)\s*(?:s|seconds)/i);

  if (matchRetry && matchRetry[1]) {
    const sec = parseFloat(matchRetry[1]);
    if (!isNaN(sec)) return Math.ceil(sec * 1000);
  }

  return null;
}

export function isRateLimitError(err: any): boolean {
  if (!err) return false;
  if (err.status === 429 || err.code === 429 || err.statusCode === 429) return true;
  if (err.errorCode === 'AI_BUSY' || err.code === 'AI_BUSY') return true;
  const msg = String(err?.message || '') + ' ' + String(err || '');
  return /429|resource[_\s]+(?:has\s+been\s+)?exhausted|rate\s*limit|quota/i.test(msg);
}

export function isApiTimeoutOrNetworkError(err: any): boolean {
  if (!err) return false;
  if (err?.name === 'AbortError') return true;
  if (err?.status === 504 || err?.status === 502) return true;
  const msg = String(err?.message || '') + ' ' + String(err || '');
  return /timed?\s*out|timeout|network\s*error|econnreset|etimedout/i.test(msg);
}

export function isApiError(err: any): boolean {
  if (!err) return false;
  if (isRateLimitError(err) || isApiTimeoutOrNetworkError(err)) return true;
  if (err?.code === 'AI_UNAVAILABLE' || err?.errorCode === 'AI_UNAVAILABLE') return true;
  if (err?.code === 'AI_BUSY' || err?.errorCode === 'AI_BUSY') return true;
  if (err?.status === 503 || err?.status === 504 || err?.status === 429) return true;
  return false;
}

export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    defaultDelayMs?: number;
    label?: string;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const defaultDelayMs = options.defaultDelayMs ?? DEFAULT_PACING_MS;
  const label = options.label ?? 'request';

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      if (!isRateLimitError(err) || attempt >= maxRetries) {
        throw err;
      }
      attempt++;
      const extractedDelay = extractRetryDelayMs(err);
      const delayMs = extractedDelay !== null ? Math.max(extractedDelay, 1500) : defaultDelayMs * attempt;
      console.warn(
        `\n[429 Rate Limit - ${label}] Phát hiện lỗi hạn mức API. Đọc retryDelay: ${extractedDelay !== null ? `${extractedDelay}ms` : 'không có (dùng giãn cách ' + delayMs + 'ms)'}. Đang chờ và thử lại (lần ${attempt}/${maxRetries})...`,
      );
      await sleep(delayMs);
    }
  }
}

