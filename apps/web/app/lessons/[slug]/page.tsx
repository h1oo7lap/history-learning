import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import {
  Clock,
  GraduationCap,
  Calendar,
  ArrowLeft,
  Users,
  Bookmark,
  Info,
  ChevronRight,
} from 'lucide-react';
import { BlockRenderer, LegacyContent } from '@/components/content/BlockRenderer';
import { extractHeadingsFromContentJson, injectHeadingIds } from '@/lib/headings';
import { TableOfContents } from '@/components/lessons/TableOfContents';
import { LessonImage } from '@/components/lessons/LessonImage';
import { LessonProgressControl } from '@/components/lessons/LessonProgressControl';
import { Card } from '@/components/ui/Card';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDifficulty, formatGrade } from '@/lib/format';
import type { PublicLessonDetail } from '@/features/lessons/api';

// ─── Data fetching (Server Component) ──────────────────────────

async function fetchLesson(slug: string): Promise<PublicLessonDetail | null> {
  try {
    const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';
    const res = await fetch(`${baseUrl}/api/lessons/${slug}`, {
      next: { revalidate: 60 }, // ISR: revalidate every 60s
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.status}`);
    const body = await res.json();
    return body.success ? (body.data as PublicLessonDetail) : null;
  } catch {
    return null;
  }
}

// ─── Metadata ──────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await fetchLesson(slug);
  if (!lesson) return { title: 'Bài học không tồn tại' };

  return {
    title: lesson.title,
    description: lesson.summary ?? undefined,
    openGraph: lesson.thumbnail
      ? {
          images: [{ url: lesson.thumbnail }],
          title: lesson.title,
          description: lesson.summary ?? undefined,
        }
      : undefined,
  };
}

// ─── Helpers ───────────────────────────────────────────────────

const difficultyBadgeVariant: Record<string, BadgeVariant> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

// ─── Page component ─────────────────────────────────────────────

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) {
    redirect(`/login?from=/lessons/${slug}`);
  }

  const lesson = await fetchLesson(slug);

  if (!lesson) {
    notFound();
  }

  const difficultyVariant = difficultyBadgeVariant[lesson.difficulty] ?? 'default';
  const difficultyLabel = formatDifficulty(lesson.difficulty);

  const topics = lesson.topics?.map((t) => t.topic) ?? [];
  const periods = lesson.periods?.map((p) => p.period) ?? [];
  const grade = lesson.grade ?? lesson.grades?.[0]?.grade;

  // Extract headings for Table of Contents
  const { headings, processedHtml } = lesson.contentJson
    ? { headings: extractHeadingsFromContentJson(lesson.contentJson), processedHtml: '' }
    : injectHeadingIds(lesson.content ?? '');

  const gradeLabel = grade ? formatGrade(grade) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-8">
      {/* ─── Breadcrumb ─── */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center flex-wrap gap-1.5">
          <li>
            <Link
              href="/"
              className="text-muted hover:text-seal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-sm"
            >
              Trang chủ
            </Link>
          </li>
          <li aria-hidden="true" className="text-muted/60">
            <ChevronRight size={14} />
          </li>
          <li>
            <Link
              href="/lessons"
              className="text-muted hover:text-seal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-sm"
            >
              Bài học
            </Link>
          </li>
          {grade && gradeLabel && (
            <>
              <li aria-hidden="true" className="text-muted/60">
                <ChevronRight size={14} />
              </li>
              <li>
                <Link
                  href={`/lessons?grade=${grade.id}`}
                  className="text-muted hover:text-seal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-sm"
                >
                  {gradeLabel}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true" className="text-muted/60">
            <ChevronRight size={14} />
          </li>
          <li
            aria-current="page"
            className="text-ink font-medium truncate max-w-[200px] sm:max-w-xs md:max-w-sm"
            title={lesson.title}
          >
            {lesson.title}
          </li>
        </ol>
      </nav>

      {/* ─── Two-column layout: Reading Column + Sidebar ─── */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-10 lg:gap-12">
        {/* ─── Main reading column (max-w-[68ch]) ─── */}
        <main id="lesson-content" className="w-full max-w-[68ch] mx-auto lg:mx-0 flex-1 min-w-0">
          {/* Header */}
          <header className="mb-8 space-y-4">
            {/* Meta badges row */}
            <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs sm:text-sm text-muted">
              <Badge variant={difficultyVariant}>{difficultyLabel}</Badge>

              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock size={15} className="text-muted/80 shrink-0" aria-hidden="true" />
                <span>{lesson.estimatedTime} phút đọc</span>
              </span>

              {grade && gradeLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-muted/80 shrink-0" aria-hidden="true" />
                  <span>{gradeLabel}</span>
                </span>
              )}

              {periods.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={15} className="text-muted/80 shrink-0" aria-hidden="true" />
                  <span>{periods.map((p) => p.name).join(', ')}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-bold text-ink leading-[1.25] tracking-tight">
              {lesson.title}
            </h1>

            {/* Summary */}
            {lesson.summary && (
              <p className="text-base sm:text-lg leading-relaxed text-ink-soft font-serif italic border-l-2 border-bronze/60 pl-4 py-1">
                {lesson.summary}
              </p>
            )}

            {/* Cover image (fixed aspect ratio, fallback placeholder, LCP priority) */}
            {lesson.thumbnail && (
              <div className="pt-2">
                <LessonImage src={lesson.thumbnail} alt={lesson.title} />
              </div>
            )}
          </header>

          {/* Mobile Table of Contents (collapsible drawer, hidden on desktop) */}
          <TableOfContents headings={headings} className="lg:hidden" />

          {/* ─── Article content ─── */}
          <article className="prose-history">
            {lesson.contentJson ? (
              <BlockRenderer contentJson={lesson.contentJson} />
            ) : (
              <LegacyContent html={processedHtml} />
            )}
          </article>

          {/* ─── End of lesson actions ─── */}
          <footer className="border-t border-line mt-12 pt-8 flex items-center justify-between flex-wrap gap-4">
            <Link
              href="/lessons"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md"
            >
              <Button variant="secondary" size="md">
                <ArrowLeft size={16} aria-hidden="true" />
                <span>Quay lại danh sách bài học</span>
              </Button>
            </Link>
            <LessonProgressControl lessonId={lesson.id} />
          </footer>
        </main>

        {/* ─── Sidebar column (desktop sticky, mobile complementary cards) ─── */}
        <aside
          aria-label="Thông tin bài học bổ sung"
          className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6"
        >
          {/* Desktop Table of Contents (sticky, hidden on mobile) */}
          <TableOfContents headings={headings} className="hidden lg:block" />

          {/* Lesson Information Card */}
          <Card className="p-5 shadow-card">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line text-sm font-semibold text-ink">
              <Info size={18} className="text-seal shrink-0" aria-hidden="true" />
              <span>Thông tin bài học</span>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Độ khó</dt>
                <dd>
                  <Badge variant={difficultyVariant}>{difficultyLabel}</Badge>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Thời gian đọc</dt>
                <dd className="font-medium text-ink">{lesson.estimatedTime} phút</dd>
              </div>

              {grade && gradeLabel && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted shrink-0">Lớp học</dt>
                  <dd className="font-medium text-ink text-right">{gradeLabel}</dd>
                </div>
              )}

              {periods.length > 0 && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted shrink-0">Giai đoạn</dt>
                  <dd className="font-medium text-ink text-right">
                    {periods.map((p) => p.name).join(', ')}
                  </dd>
                </div>
              )}

              {topics.length > 0 && (
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-muted shrink-0">Chủ đề</dt>
                  <dd className="font-medium text-ink text-right">
                    {topics.map((t) => t.name).join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Related Characters Card (only displayed when data exists) */}
          {lesson.characters && lesson.characters.length > 0 && (
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line text-sm font-semibold text-ink">
                <Users size={18} className="text-seal shrink-0" aria-hidden="true" />
                <span>Nhân vật lịch sử</span>
              </div>

              <div className="space-y-2.5">
                {lesson.characters.map(({ character, role }) => (
                  <div
                    key={character.id}
                    className="p-3 rounded-md border border-line bg-card/60 transition-colors"
                  >
                    <div className="font-medium text-sm text-ink">{character.name}</div>
                    {role && (
                      <div className="text-xs text-muted mt-1 leading-snug">{role}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Related Events Card (only displayed when data exists) */}
          {lesson.events && lesson.events.length > 0 && (
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line text-sm font-semibold text-ink">
                <Bookmark size={18} className="text-seal shrink-0" aria-hidden="true" />
                <span>Sự kiện liên quan</span>
              </div>

              <ul className="space-y-2 text-sm">
                {lesson.events.map(({ event }) => (
                  <li
                    key={event.id}
                    className="p-3 rounded-md border border-line bg-card/60 font-medium text-ink leading-snug"
                  >
                    {event.name}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
