import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BlockRenderer, LegacyContent } from '@/components/content/BlockRenderer';
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

// ─── Page component ─────────────────────────────────────────────

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = await fetchLesson(slug);

  if (!lesson) notFound();

  const difficultyLabel = DIFFICULTY_LABELS[lesson.difficulty] ?? lesson.difficulty;
  const difficultyColor = DIFFICULTY_COLORS[lesson.difficulty] ?? 'var(--muted)';

  const topics = lesson.topics.map((t) => t.topic);
  const periods = lesson.periods.map((p) => p.period);
  const grades = lesson.grades.map((g) => g.grade);

  return (
    <div className="lesson-page">
      {/* ── Breadcrumb ── */}
      <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
        <Link href="/" className="lesson-breadcrumb-link">Trang chủ</Link>
        <span className="lesson-breadcrumb-sep" aria-hidden="true">›</span>
        <Link href="/lessons" className="lesson-breadcrumb-link">Bài học</Link>
        <span className="lesson-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="lesson-breadcrumb-current">{lesson.title}</span>
      </nav>

      <div className="lesson-layout">
        {/* ── Main content ── */}
        <main className="lesson-main" id="lesson-content">
          {/* Hero */}
          <header className="lesson-header">
            {lesson.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lesson.thumbnail}
                alt={lesson.title}
                className="lesson-thumbnail"
              />
            )}

            <div className="lesson-meta-row">
              {/* Difficulty badge */}
              <span
                className="lesson-difficulty-badge"
                style={{ background: difficultyColor + '20', color: difficultyColor, borderColor: difficultyColor + '40' }}
              >
                {difficultyLabel}
              </span>

              {/* Estimated time */}
              <span className="lesson-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {lesson.estimatedTime} phút
              </span>

              {/* Grades */}
              {grades.length > 0 && (
                <span className="lesson-meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  {grades.map((g) => g.name).join(', ')}
                </span>
              )}
            </div>

            <h1 className="lesson-title">{lesson.title}</h1>

            {lesson.summary && (
              <p className="lesson-summary">{lesson.summary}</p>
            )}

            {/* Taxonomy tags */}
            {(topics.length > 0 || periods.length > 0) && (
              <div className="lesson-tags">
                {topics.map((t) => (
                  <span key={t.id} className="lesson-tag lesson-tag--topic">
                    {t.name}
                  </span>
                ))}
                {periods.map((p) => (
                  <span key={p.id} className="lesson-tag lesson-tag--period">
                    📅 {p.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* ── Content blocks ── */}
          <article className="lesson-article">
            {lesson.contentJson ? (
              <BlockRenderer contentJson={lesson.contentJson} />
            ) : (
              <LegacyContent html={lesson.content} />
            )}
          </article>

          {/* ── Related characters ── */}
          {lesson.characters.length > 0 && (
            <section className="lesson-section" aria-labelledby="characters-heading">
              <h2 id="characters-heading" className="lesson-section-title">
                <span aria-hidden="true">👤</span> Nhân vật lịch sử
              </h2>
              <div className="lesson-character-list">
                {lesson.characters.map(({ character, role }) => (
                  <div key={character.id} className="lesson-character-card">
                    <span className="lesson-character-name">{character.name}</span>
                    {role && <span className="lesson-character-role">{role}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Related events ── */}
          {lesson.events.length > 0 && (
            <section className="lesson-section" aria-labelledby="events-heading">
              <h2 id="events-heading" className="lesson-section-title">
                <span aria-hidden="true">📌</span> Sự kiện liên quan
              </h2>
              <ul className="lesson-event-list">
                {lesson.events.map(({ event }) => (
                  <li key={event.id} className="lesson-event-item">
                    {event.name}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>

        {/* ── Sidebar ── */}
        <aside className="lesson-sidebar" aria-label="Thông tin bài học">
          <div className="lesson-sidebar-card">
            <h2 className="lesson-sidebar-title">Thông tin bài học</h2>

            <dl className="lesson-info-list">
              <div className="lesson-info-row">
                <dt>Độ khó</dt>
                <dd style={{ color: difficultyColor, fontWeight: 600 }}>{difficultyLabel}</dd>
              </div>
              <div className="lesson-info-row">
                <dt>Thời gian ước tính</dt>
                <dd>{lesson.estimatedTime} phút</dd>
              </div>
              {grades.length > 0 && (
                <div className="lesson-info-row">
                  <dt>Lớp học</dt>
                  <dd>{grades.map((g) => g.name).join(', ')}</dd>
                </div>
              )}
              {topics.length > 0 && (
                <div className="lesson-info-row">
                  <dt>Chủ đề</dt>
                  <dd>{topics.map((t) => t.name).join(', ')}</dd>
                </div>
              )}
              {periods.length > 0 && (
                <div className="lesson-info-row">
                  <dt>Giai đoạn</dt>
                  <dd>{periods.map((p) => p.name).join(', ')}</dd>
                </div>
              )}
            </dl>

            <Link href="/dashboard" className="btn btn-primary btn-full" style={{ marginTop: '1.25rem' }}>
              Bắt đầu học
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
