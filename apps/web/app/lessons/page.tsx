import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import type { PaginatedLessons } from '@/features/lessons/api';
import { LessonCard } from '@/components/lessons/LessonCard';
import { LessonFilterBar } from '@/components/lessons/LessonFilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatGrade } from '@/lib/format';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Danh sách bài học',
  description:
    'Khám phá tất cả bài học lịch sử Việt Nam phân chia theo từng khối lớp từ lớp 4 đến lớp 12.',
};

// ─── Data Types ─────────────────────────────────────────────────

interface GradeOption {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
}

interface EducationLevelOption {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  grades: GradeOption[];
}

interface CurrentUserSummary {
  id: string;
  fullName: string;
  email: string;
  gradeId: string | null;
  grade?: { id: string; name: string; code: string } | null;
}

interface FetchResult {
  data: PaginatedLessons | null;
  error: boolean;
}

// ─── Data Fetching ──────────────────────────────────────────────

async function fetchEducationLevels(): Promise<EducationLevelOption[]> {
  const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${baseUrl}/api/education-levels`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.success && Array.isArray(body.data) ? body.data : [];
  } catch {
    return [];
  }
}

async function fetchCurrentUser(): Promise<CurrentUserSummary | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return null;

  const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
  try {
    const res = await fetch(`${baseUrl}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `access_token=${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.success && body.data ? (body.data as CurrentUserSummary) : null;
  } catch {
    return null;
  }
}

async function fetchLessons(params: {
  page?: string;
  pageSize?: string;
  search?: string;
  difficulty?: string;
  gradeId?: string;
  simulate_error?: string;
  token?: string;
}): Promise<FetchResult> {
  // Chỉ kích hoạt giả lập lỗi khi kiểm thử trong dev
  if (process.env.NODE_ENV !== 'production' && params.simulate_error === '1') {
    return { data: null, error: true };
  }

  const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  const qs = new URLSearchParams();
  if (params.page) qs.set('page', params.page);
  qs.set('pageSize', params.pageSize ?? '12');
  if (params.search) qs.set('search', params.search);
  if (params.difficulty) qs.set('difficulty', params.difficulty);
  if (params.gradeId) qs.set('gradeId', params.gradeId);

  try {
    const res = await fetch(`${baseUrl}/api/lessons?${qs.toString()}`, {
      headers: params.token
        ? {
            Cookie: `access_token=${params.token}`,
            Authorization: `Bearer ${params.token}`,
          }
        : {},
      cache: 'no-store',
    });

    if (!res.ok) {
      return { data: null, error: true };
    }

    const body = await res.json();
    if (body.success && body.data) {
      return { data: body.data, error: false };
    }
    return { data: null, error: true };
  } catch {
    return { data: null, error: true };
  }
}

// ─── Main Page Component ────────────────────────────────────────

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const sp = await searchParams;

  const [currentUser, educationLevels] = await Promise.all([
    fetchCurrentUser(),
    fetchEducationLevels(),
  ]);

  // Tất cả các lớp theo thứ tự cấp học và hiển thị
  const allGrades = educationLevels.flatMap((lvl) => lvl.grades);

  // Lớp của user đăng nhập (nếu có)
  const userGradeId = currentUser?.gradeId ?? null;
  const userGradeObj = allGrades.find((g) => g.id === userGradeId);
  const userGradeLabel = userGradeObj ? formatGrade(userGradeObj) : '';

  // Xác định lớp đang được chọn hiển thị:
  // 1. Nếu có query param ?grade= hoặc ?gradeId=
  // 2. Nếu không có query param, ưu tiên lấy lớp của user đã đăng nhập
  // 3. Nếu chưa đăng nhập hoặc user chưa chọn lớp, mặc định chọn lớp đầu tiên (Lớp 4)
  const explicitGradeParam = sp.grade || sp.gradeId || '';
  const activeGradeObj = explicitGradeParam
    ? allGrades.find((g) => g.id === explicitGradeParam || g.code === explicitGradeParam) ??
      userGradeObj ??
      allGrades[0]
    : userGradeObj ?? allGrades[0];

  const activeGradeId = activeGradeObj?.id ?? '';
  const activeGradeLabel = activeGradeObj ? formatGrade(activeGradeObj) : '';

  const isViewingUserGrade = Boolean(userGradeId && activeGradeId === userGradeId);

  const search = sp.search ?? '';
  const difficulty = sp.difficulty ?? '';

  // Gọi API lấy bài học cho lớp đang chọn
  const lessonsResult = await fetchLessons({
    page: sp.page,
    pageSize: sp.pageSize,
    search,
    difficulty,
    gradeId: activeGradeId,
    simulate_error: sp.simulate_error,
    token,
  });

  const { data, error } = lessonsResult;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = Boolean(search || difficulty);

  // URL xây dựng cho chuyển trang
  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (explicitGradeParam || activeGradeId) {
      params.set('grade', activeGradeId);
    }
    if (search) params.set('search', search);
    if (difficulty) params.set('difficulty', difficulty);
    params.set('page', String(pageNumber));
    return `/lessons?${params.toString()}`;
  };

  // URL xây dựng cho chuyển lớp
  const buildGradeUrl = (gradeId: string) => {
    const params = new URLSearchParams();
    params.set('grade', gradeId);
    if (search) params.set('search', search);
    if (difficulty) params.set('difficulty', difficulty);
    return `/lessons?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      {/* ─── Page Header ─── */}
      <PageHeader
        title="Bài học Lịch sử"
        description="Khám phá các trang sử hào hùng của dân tộc Việt Nam phân chia theo từng khối lớp từ lớp 4 đến lớp 12."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Bài học' },
        ]}
      />

      {/* ─── Thông báo ngữ cảnh lớp học ─── */}
      {userGradeId ? (
        isViewingUserGrade ? (
          <div className="p-4 rounded-md border border-seal/30 bg-seal/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <CheckCircle2 size={18} className="text-seal shrink-0" aria-hidden="true" />
              <span>
                Đang hiển thị bài học thuộc <strong>{activeGradeLabel}</strong> (Khối lớp của bạn).
              </span>
            </div>
            <span className="text-xs text-muted">
              Bạn có thể chọn khối lớp khác ở danh sách bên dưới để xem thêm.
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-md border border-bronze/40 bg-bronze/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <GraduationCap size={18} className="text-bronze-ink shrink-0" aria-hidden="true" />
              <span>
                Bạn đang xem bài học của <strong>{activeGradeLabel}</strong>. Khối lớp của bạn là{' '}
                <strong>{userGradeLabel}</strong>.
              </span>
            </div>
            <Button asChild variant="secondary" size="sm">
              <Link href="/lessons" className="gap-1.5">
                <span>Quay về {userGradeLabel} của bạn</span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )
      ) : (
        <div className="p-3.5 rounded-md border border-line bg-card/60 flex items-center justify-between flex-wrap gap-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-seal shrink-0" aria-hidden="true" />
            <span>
              Đang xem bài học theo <strong>{activeGradeLabel}</strong>.
            </span>
          </div>
          <Link
            href="/onboarding/grade"
            className="text-xs text-seal font-medium hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-seal"
          >
            Cập nhật khối lớp của bạn →
          </Link>
        </div>
      )}

      {/* ─── Thanh Tabs chia theo Lớp ─── */}
      <nav
        aria-label="Chọn khối lớp bài học"
        className="rounded-md border border-line bg-card p-4 sm:p-5 shadow-card space-y-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-line/60">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-ink flex items-center gap-2">
              <GraduationCap size={20} className="text-seal shrink-0" aria-hidden="true" />
              <span>Khối lớp học</span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Mỗi bài học được biên soạn chuẩn theo một khối lớp cụ thể
            </p>
          </div>
          {userGradeObj && (
            <span className="text-xs font-medium text-seal bg-seal/10 border border-seal/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <UserCheck size={14} aria-hidden="true" />
              Lớp của bạn: <strong>{userGradeLabel}</strong>
            </span>
          )}
        </div>

        <div className="space-y-3">
          {educationLevels.map((lvl) => (
            <div
              key={lvl.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1.5 border-t border-line/40 first:border-t-0 first:pt-0"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-bronze-ink sm:w-28 shrink-0">
                {lvl.name}
              </span>
              <div className="flex flex-wrap gap-2">
                {lvl.grades.map((g) => {
                  const isActive = g.id === activeGradeId;
                  const isUserGrade = g.id === userGradeId;
                  return (
                    <Link
                      key={g.id}
                      href={buildGradeUrl(g.id)}
                      className={cn(
                        'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal min-h-[40px]',
                        isActive
                          ? 'bg-seal text-paper shadow-sm'
                          : 'bg-paper hover:bg-line/40 text-ink border border-line hover:border-bronze/60'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span>{formatGrade(g)}</span>
                      {isUserGrade && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0',
                            isActive ? 'bg-paper/20 text-paper' : 'bg-seal/15 text-seal'
                          )}
                        >
                          Của bạn
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* ─── Search & Filter Bar (Tự động lọc khi gõ hoặc chọn độ khó) ─── */}
      <LessonFilterBar
        initialSearch={search}
        initialDifficulty={difficulty}
        gradeId={activeGradeId}
        gradeLabel={activeGradeLabel}
      />

      {/* ─── Error State ─── */}
      {error && (
        <ErrorState
          title="Không thể tải danh sách bài học"
          description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối và thử lại."
          retryHref={buildGradeUrl(activeGradeId)}
        />
      )}

      {/* ─── Success Data Content ─── */}
      {!error && data && (
        <>
          {/* Dòng thông tin số lượng kết quả */}
          <div className="flex items-center justify-between text-sm text-muted">
            <p>
              Có <strong className="font-semibold text-ink">{data.total}</strong> bài học thuộc{' '}
              <strong className="font-semibold text-ink">{activeGradeLabel}</strong>
              {search && (
                <span>
                  {' '}cho từ khóa &ldquo;<span className="text-ink font-medium">{search}</span>&rdquo;
                </span>
              )}
            </p>
            {data.total > 0 && (
              <span className="text-xs">
                Trang {currentPage} / {totalPages}
              </span>
            )}
          </div>

          {/* Danh sách bài học hoặc Trạng thái rỗng */}
          {data.items.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title={
                hasFilter
                  ? `Không tìm thấy bài học nào phù hợp trong ${activeGradeLabel}`
                  : `Chưa có bài học nào được xuất bản cho ${activeGradeLabel}`
              }
              description={
                hasFilter
                  ? 'Không tìm thấy bài học nào khớp với bộ lọc đang chọn. Bạn hãy thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc.'
                  : `Nội dung các bài học lịch sử cho ${activeGradeLabel} đang được biên soạn và sẽ sớm ra mắt.`
              }
              action={
                hasFilter
                  ? {
                      label: 'Xóa bộ lọc tìm kiếm',
                      href: buildGradeUrl(activeGradeId),
                    }
                  : undefined
              }
            />
          ) : (
            <div
              id="lessons-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {data.items.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <nav
              aria-label="Điều hướng phân trang bài học"
              className="pt-6 border-t border-line/60 flex items-center justify-between gap-2"
            >
              {/* Nút Trước */}
              {currentPage > 1 ? (
                <Button asChild variant="secondary" size="sm" id="pagination-prev">
                  <Link href={buildPageUrl(currentPage - 1)}>← Trang trước</Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  ← Trang trước
                </Button>
              )}

              {/* Thông tin số trang */}
              <span className="text-xs sm:text-sm text-muted font-medium">
                {currentPage} / {totalPages}
              </span>

              {/* Nút Sau */}
              {currentPage < totalPages ? (
                <Button asChild variant="secondary" size="sm" id="pagination-next">
                  <Link href={buildPageUrl(currentPage + 1)}>Trang sau →</Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled>
                  Trang sau →
                </Button>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
