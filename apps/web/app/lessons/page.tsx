import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, BookOpen, RotateCcw } from 'lucide-react';
import type { PaginatedLessons } from '@/features/lessons/api';
import { LessonCard } from '@/components/lessons/LessonCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatGrade } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Danh sách bài học',
  description:
    'Khám phá tất cả bài học lịch sử Việt Nam qua các triều đại và giai đoạn dựng nước, giữ nước hào hùng.',
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

async function fetchLessons(searchParams: Record<string, string>): Promise<FetchResult> {
  // Chỉ kích hoạt giả lập lỗi khi kiểm thử trong dev
  if (process.env.NODE_ENV !== 'production' && searchParams.simulate_error === '1') {
    return { data: null, error: true };
  }

  const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  const qs = new URLSearchParams();
  if (searchParams.page) qs.set('page', searchParams.page);
  if (searchParams.pageSize) qs.set('pageSize', searchParams.pageSize ?? '12');
  if (searchParams.search) qs.set('search', searchParams.search);
  if (searchParams.difficulty) qs.set('difficulty', searchParams.difficulty);

  // Lọc theo lớp: đồng bộ ?grade= lên URL, gửi gradeId cho API
  const gradeId = searchParams.grade || searchParams.gradeId;
  if (gradeId) qs.set('gradeId', gradeId);

  if (!qs.has('pageSize')) qs.set('pageSize', '12');

  try {
    const res = await fetch(`${baseUrl}/api/lessons?${qs.toString()}`, {
      next: { revalidate: 30 },
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
  const sp = await searchParams;
  const [lessonsResult, educationLevels] = await Promise.all([
    fetchLessons(sp),
    fetchEducationLevels(),
  ]);
  const { data, error } = lessonsResult;

  const search = sp.search ?? '';
  const difficulty = sp.difficulty ?? '';
  const selectedGrade = sp.grade || sp.gradeId || '';

  // Tìm lớp được chọn để hiển thị nhãn thân thiện (ví dụ "Lớp 4")
  const allGrades = educationLevels.flatMap((lvl) => lvl.grades);
  const selectedGradeObj = allGrades.find(
    (g) => g.id === selectedGrade || g.code === selectedGrade
  );
  const selectedGradeLabel = selectedGradeObj ? formatGrade(selectedGradeObj) : '';

  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasFilter = Boolean(search || difficulty || selectedGrade);

  // Tạo URL cho phân trang
  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(sp);
    params.set('page', String(pageNumber));
    return `/lessons?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 md:space-y-8">
      {/* ─── Page Header ─── */}
      <PageHeader
        title="Bài học Lịch sử"
        description="Khám phá các trang sử hào hùng của dân tộc Việt Nam qua từng thời kỳ, triều đại và chiến công hiển hách."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Bài học' },
        ]}
      />

      {/* ─── Search & Filter Bar ─── */}
      <form
        method="GET"
        action="/lessons"
        role="search"
        className="p-4 rounded-md border border-line bg-card shadow-card space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Ô tìm kiếm */}
          <div className="sm:col-span-4 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="lesson-search-input"
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Tìm bài học, nhân vật..."
              className="pl-9"
              aria-label="Tìm kiếm bài học"
            />
          </div>

          {/* Lọc theo lớp học */}
          <div className="sm:col-span-3">
            <Select
              id="lesson-grade-select"
              name="grade"
              defaultValue={selectedGrade}
              aria-label="Lọc theo lớp học"
            >
              <option value="">Tất cả các lớp</option>
              {educationLevels.map((lvl) => (
                <optgroup key={lvl.id} label={lvl.name}>
                  {lvl.grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {formatGrade(g)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>

          {/* Lọc độ khó */}
          <div className="sm:col-span-3">
            <Select
              id="lesson-difficulty-select"
              name="difficulty"
              defaultValue={difficulty}
              aria-label="Lọc theo độ khó"
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Cơ bản</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Nâng cao</option>
            </Select>
          </div>

          {/* Nút hành động */}
          <div className="sm:col-span-2 flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              id="lesson-search-btn"
              className="flex-1"
            >
              Lọc
            </Button>

            {hasFilter && (
              <Button asChild variant="ghost" size="md">
                <Link href="/lessons" id="lesson-clear-filter" title="Xóa bộ lọc">
                  <RotateCcw size={16} aria-hidden="true" />
                  <span className="sr-only sm:not-sr-only">Xóa</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* ─── Error State ─── */}
      {error && (
        <ErrorState
          title="Không thể tải danh sách bài học"
          description="Đã xảy ra lỗi khi kết nối tới máy chủ. Vui lòng kiểm tra lại kết nối và thử lại."
          retryHref="/lessons"
        />
      )}

      {/* ─── Success Data Content ─── */}
      {!error && data && (
        <>
          {/* Dòng thông tin số lượng kết quả */}
          <div className="flex items-center justify-between text-sm text-muted">
            <p>
              Có <strong className="font-semibold text-ink">{data.total}</strong> bài học
              {selectedGradeLabel && (
                <span>
                  {' '}thuộc <strong className="font-semibold text-ink">{selectedGradeLabel}</strong>
                </span>
              )}
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
              title={hasFilter ? 'Không tìm thấy bài học phù hợp' : 'Chưa có bài học nào được xuất bản'}
              description={
                hasFilter
                  ? 'Không tìm thấy bài học nào khớp với bộ lọc đang chọn. Bạn hãy thử chọn lớp khác, đổi từ khóa tìm kiếm hoặc xóa bộ lọc.'
                  : 'Nội dung các bài học lịch sử đang được biên soạn và sẽ sớm ra mắt.'
              }
              action={
                hasFilter
                  ? {
                      label: 'Xóa bộ lọc',
                      href: '/lessons',
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
