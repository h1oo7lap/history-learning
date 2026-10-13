import type { Metadata } from 'next';
import Link from 'next/link';
import type { PublicLessonSummary, PaginatedLessons } from '@/features/lessons/api';

export const metadata: Metadata = {
  title: 'Danh sách bài học',
  description: 'Khám phá tất cả bài học lịch sử Việt Nam và thế giới. Học theo chủ đề, giai đoạn lịch sử và lớp học.',
};

// ─── Data fetching ──────────────────────────────────────────────

async function fetchLessons(searchParams: Record<string, string>): Promise<PaginatedLessons> {
  const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  const qs = new URLSearchParams();
  if (searchParams.page) qs.set('page', searchParams.page);
  if (searchParams.pageSize) qs.set('pageSize', searchParams.pageSize ?? '12');
  if (searchParams.search) qs.set('search', searchParams.search);
  if (searchParams.gradeId) qs.set('gradeId', searchParams.gradeId);
  if (searchParams.topicId) qs.set('topicId', searchParams.topicId);
  if (searchParams.difficulty) qs.set('difficulty', searchParams.difficulty);
  if (!qs.has('pageSize')) qs.set('pageSize', '12');

  const res = await fetch(`${baseUrl}/api/lessons?${qs.toString()}`, {
    next: { revalidate: 30 },
  });

  if (!res.ok) return { items: [], page: 1, pageSize: 12, total: 0, totalPages: 0 };
  const body = await res.json();
  return body.success ? body.data : { items: [], page: 1, pageSize: 12, total: 0, totalPages: 0 };
}

// ─── Helpers ───────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Cơ bản',
  MEDIUM: 'Trung bình',
  HARD: 'Nâng cao',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#10b981',
  MEDIUM: '#f59e0b',
  HARD: '#ef4444',
};

// ─── Lesson Card ────────────────────────────────────────────────

function LessonCard({ lesson }: { lesson: PublicLessonSummary }) {
  const diffLabel = DIFFICULTY_LABELS[lesson.difficulty] ?? lesson.difficulty;
  const diffColor = DIFFICULTY_COLORS[lesson.difficulty] ?? 'var(--muted)';
  const topics = lesson.topics.map((t) => t.topic);

  return (
    <Link href={`/lessons/${lesson.slug}`} className="lesson-card-link">
      <article className="lesson-card">
        {lesson.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lesson.thumbnail}
            alt={lesson.title}
            className="lesson-card-thumb"
            loading="lazy"
          />
        ) : (
          <div className="lesson-card-thumb-placeholder" aria-hidden="true">
            <span>📖</span>
          </div>
        )}

        <div className="lesson-card-body">
          <div className="lesson-card-meta">
            <span
              className="lesson-card-difficulty"
              style={{ color: diffColor, background: diffColor + '18' }}
            >
              {diffLabel}
            </span>
            <span className="lesson-card-time">⏱ {lesson.estimatedTime} phút</span>
          </div>

          <h2 className="lesson-card-title">{lesson.title}</h2>

          {lesson.summary && (
            <p className="lesson-card-summary">{lesson.summary}</p>
          )}

          {topics.length > 0 && (
            <div className="lesson-card-tags">
              {topics.slice(0, 2).map((t) => (
                <span key={t.id} className="lesson-card-tag">{t.name}</span>
              ))}
              {topics.length > 2 && (
                <span className="lesson-card-tag lesson-card-tag--more">+{topics.length - 2}</span>
              )}
            </div>
          )}
        </div>

        <div className="lesson-card-footer">
          <span className="lesson-card-cta">Học ngay →</span>
        </div>
      </article>
    </Link>
  );
}

// ─── Empty state ────────────────────────────────────────────────

function EmptyState({ search }: { search?: string }) {
  return (
    <div className="lessons-empty">
      <div className="lessons-empty-icon">📚</div>
      <h2 className="lessons-empty-title">
        {search ? 'Không tìm thấy bài học' : 'Chưa có bài học nào'}
      </h2>
      <p className="lessons-empty-desc">
        {search
          ? `Không có kết quả cho "${search}". Thử tìm kiếm với từ khóa khác.`
          : 'Các bài học sẽ được thêm vào sớm. Hãy quay lại sau nhé!'}
      </p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const data = await fetchLessons(sp);
  const currentPage = data.page;
  const search = sp.search ?? '';

  // Build URL helper for pagination
  const buildUrl = (page: number) => {
    const params = new URLSearchParams(sp);
    params.set('page', String(page));
    return `/lessons?${params.toString()}`;
  };

  return (
    <div className="lessons-page">
      {/* ── Header ── */}
      <div className="lessons-hero">
        <div className="lessons-hero-inner">
          <h1 className="lessons-hero-title">
            <span className="lessons-hero-icon" aria-hidden="true">📚</span>
            Bài học lịch sử
          </h1>
          <p className="lessons-hero-sub">
            Khám phá {data.total > 0 ? `${data.total} bài học` : 'các bài học'} về lịch sử Việt Nam và thế giới
          </p>
        </div>
      </div>

      <div className="lessons-content">
        {/* ── Search bar ── */}
        <form method="GET" action="/lessons" className="lessons-search-form" role="search">
          <div className="lessons-search-row">
            <div className="lessons-search-wrap">
              <svg className="lessons-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="lesson-search"
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Tìm kiếm bài học..."
                className="input lessons-search-input"
                aria-label="Tìm kiếm bài học"
              />
            </div>

            <select
              name="difficulty"
              defaultValue={sp.difficulty ?? ''}
              className="input lessons-filter-select"
              aria-label="Lọc theo độ khó"
            >
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Cơ bản</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Nâng cao</option>
            </select>

            <button type="submit" className="btn btn-primary" id="lesson-search-btn">
              Tìm kiếm
            </button>

            {(search || sp.difficulty) && (
              <Link href="/lessons" className="btn btn-ghost" id="lesson-search-clear">
                Xóa bộ lọc
              </Link>
            )}
          </div>
        </form>

        {/* ── Results info ── */}
        {data.total > 0 && (
          <p className="lessons-results-info">
            Hiển thị {data.items.length} / {data.total} bài học
            {search && <> cho <strong>"{search}"</strong></>}
          </p>
        )}

        {/* ── Grid ── */}
        {data.items.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="lessons-grid" id="lessons-grid">
            {data.items.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {data.totalPages > 1 && (
          <nav className="lessons-pagination" aria-label="Phân trang">
            {currentPage > 1 && (
              <Link href={buildUrl(currentPage - 1)} className="btn btn-outline btn-sm" id="pagination-prev">
                ← Trước
              </Link>
            )}

            <div className="lessons-pagination-pages">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildUrl(p)}
                  className={`lessons-pagination-dot${p === currentPage ? ' active' : ''}`}
                  id={`pagination-page-${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                  aria-label={`Trang ${p}`}
                >
                  {p}
                </Link>
              ))}
            </div>

            {currentPage < data.totalPages && (
              <Link href={buildUrl(currentPage + 1)} className="btn btn-outline btn-sm" id="pagination-next">
                Tiếp →
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
