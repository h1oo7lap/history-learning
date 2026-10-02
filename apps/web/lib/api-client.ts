/**
 * API client for the History Learning platform.
 * All requests go through the Next.js /api/* proxy which proxies to NestJS.
 * Handles response envelope, 401 redirect, and error mapping.
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

class ApiClientError extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `/api/${path.replace(/^\//, '')}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (res.status === 401) {
    // Do NOT use window.location.href here — it causes a redirect loop:
    // middleware sees the cookie and redirects back to /dashboard.
    // Let AuthGate / callers handle redirect via router.replace('/login').
    throw new ApiClientError('UNAUTHORIZED', 401, 'Authentication required');
  }

  // 204 No Content (e.g. DELETE) — no body to parse
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // Non-JSON response — treat as raw text error
    const text = await res.text();
    throw new ApiClientError('UNKNOWN_ERROR', res.status, text || 'Unknown error');
  }

  const body = await res.json() as ApiResponse<T> | ApiError;

  if (!body.success) {
    const err = body as ApiError;
    throw new ApiClientError(err.errorCode, res.status, err.message);
  }

  return (body as ApiResponse<T>).data;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>) => {
    const url = params
      ? `${path}?${new URLSearchParams(
          Object.fromEntries(
            Object.entries(params)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, String(v)]),
          ),
        )}`
      : path;
    return request<T>(url, { method: 'GET' });
  },

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiClientError };
