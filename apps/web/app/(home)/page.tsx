import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { LessonCard } from '@/components/lessons/LessonCard';
import { optimizeCloudinaryUrl } from '@/lib/format';
import type { PublicLessonSummary } from '@/features/lessons/api';

export const metadata: Metadata = {
  title: 'Học Lịch Sử - Nền tảng học lịch sử Việt Nam',
  description:
    'Học lịch sử Việt Nam qua các bài học đa phương tiện, niên biểu các thời kỳ và hệ thống câu hỏi củng cố dành cho học sinh từ lớp 4 đến lớp 12.',
};

// ─── Data Types ─────────────────────────────────────────────────

interface GradeItem {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
}

interface EducationLevelItem {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  grades: GradeItem[];
}

interface PeriodItem {
  id: string;
  name: string;
  slug: string;
  startYear: number | null;
  endYear: number | null;
  displayOrder: number;
}

// ─── Helpers ───────────────────────────────────────────────────

function formatPeriodYears(startYear: number | null, endYear: number | null): string {
  if (startYear === null && endYear === null) return '';
  const fmt = (y: number) => (y < 0 ? `${Math.abs(y)} TCN` : `${y}`);
  if (startYear !== null && endYear !== null) return `${fmt(startYear)} – ${fmt(endYear)}`;
  if (startYear !== null) return `Từ ${fmt(startYear)}`;
  if (endYear !== null) return `Đến ${fmt(endYear)}`;
  return '';
}

// ─── Data Fetching ──────────────────────────────────────────────

interface HomeData {
  educationLevels: EducationLevelItem[];
  latestLessons: PublicLessonSummary[];
  periods: PeriodItem[];
  error: boolean;
}

async function fetchHomeData(simulateError: boolean): Promise<HomeData> {
  if (simulateError) {
    return { educationLevels: [], latestLessons: [], periods: [], error: true };
  }

  const baseUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

  try {
    const [levelsRes, lessonsRes, periodsRes] = await Promise.all([
      fetch(`${baseUrl}/api/education-levels`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/api/lessons?pageSize=6&isFeatured=true`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/periods`, { next: { revalidate: 3600 } }),
    ]);

    if (!levelsRes.ok && !lessonsRes.ok) {
      return { educationLevels: [], latestLessons: [], periods: [], error: true };
    }

    const levelsBody = levelsRes.ok ? await levelsRes.json() : null;
    const lessonsBody = lessonsRes.ok ? await lessonsRes.json() : null;
    const periodsBody = periodsRes.ok ? await periodsRes.json() : null;

    return {
      educationLevels: levelsBody?.success && Array.isArray(levelsBody.data) ? levelsBody.data : [],
      latestLessons: lessonsBody?.success && lessonsBody.data?.items ? lessonsBody.data.items : [],
      periods: periodsBody?.success && periodsBody.data?.items ? periodsBody.data.items : [],
      error: false,
    };
  } catch {
    return { educationLevels: [], latestLessons: [], periods: [], error: true };
  }
}

// ─── Page Component ─────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.has('access_token');

  const sp = await searchParams;
  // Chỉ kích hoạt giả lập lỗi trong môi trường phát triển (không kích hoạt trong production)
  const isDev = process.env.NODE_ENV !== 'production';
  const simulateError = isDev && sp.simulate_error === '1';

  const { educationLevels, latestLessons, periods, error } = await fetchHomeData(simulateError);

  // Chọn bài học tiêu biểu (isFeatured) cho khung ảnh tư liệu bên phải Hero
  const featuredLesson =
    latestLessons.find((l) => l.isFeatured && l.thumbnail) ??
    latestLessons.find((l) => l.isFeatured) ??
    latestLessons.find((l) => l.thumbnail) ??
    latestLessons[0];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* ─── Navbar dùng chung ─── */}
      <Navbar />

      {/* ─── Nội dung chính ─── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 space-y-16 sm:space-y-20">
        {/* Trường hợp API lỗi */}
        {error ? (
          <div className="py-12">
            <ErrorState
              title="Không thể tải nội dung trang chủ"
              description="Hệ thống không thể kết nối tới máy chủ dữ liệu vào lúc này. Vui lòng thử lại sau ít phút."
              retryHref="/"
              retryLabel="Tải lại trang"
            />
          </div>
        ) : (
          <>
            {/* ─── 1. Hero: Căn trái, tiêu đề serif, tư liệu thật bên phải ─── */}
            <section
              aria-labelledby="hero-title"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="space-y-2">
                  <div className="h-[5px] w-16 border-y border-bronze" aria-hidden="true" />
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-bronze-ink">
                    Sử liệu & Chương trình phổ thông
                  </p>
                </div>

                <h1
                  id="hero-title"
                  className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-bold text-ink leading-[1.2] tracking-tight"
                >
                  Học lịch sử Việt Nam
                  <br className="hidden sm:inline" /> theo từng giai đoạn
                </h1>

                <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-xl">
                  Hệ thống bài học đa phương tiện, niên biểu các thời kỳ và tư liệu lịch sử chọn lọc
                  dành cho học sinh từ lớp 4 đến lớp 12.
                </p>

                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <Link
                    href={isAuthenticated ? '/lessons' : '/register'}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md"
                  >
                    <Button variant="primary" size="lg" className="gap-2">
                      <span>Bắt đầu học</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link
                    href={isAuthenticated ? '/lessons' : '/login?from=/lessons'}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md"
                  >
                    <Button variant="secondary" size="lg">
                      <span>Xem bài học</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Khung hình ảnh tư liệu thật bên phải (hoặc niên biểu tóm tắt) */}
              <div className="lg:col-span-5">
                {isAuthenticated && featuredLesson ? (
                  <div className="w-full max-w-md mx-auto lg:max-w-none">
                    <figure className="group rounded-md border border-line bg-card p-3 shadow-card transition-colors hover:border-bronze/60">
                      <Link
                        href={`/lessons/${featuredLesson.slug}`}
                        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-sm"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden rounded-sm bg-paper border border-line">
                          {featuredLesson.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={optimizeCloudinaryUrl(featuredLesson.thumbnail, 800)}
                              alt={featuredLesson.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                              <BookOpen size={40} className="text-muted/60 mb-2" aria-hidden="true" />
                              <span className="font-serif text-sm">Tư liệu lịch sử</span>
                            </div>
                          )}
                        </div>
                        <figcaption className="mt-3 px-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-bronze-ink">
                            Bài học nổi bật
                          </p>
                          <p className="font-serif text-base font-semibold text-ink line-clamp-1 group-hover:text-seal transition-colors">
                            {featuredLesson.title}
                          </p>
                          <p className="text-[13px] leading-5 text-muted line-clamp-2 mt-1 font-sans">
                            {featuredLesson.summary || 'Khám phá trang sử hào hùng của dân tộc Việt Nam.'}
                          </p>
                        </figcaption>
                      </Link>
                    </figure>
                  </div>
                ) : (
                  <div className="w-full max-w-md mx-auto lg:max-w-none rounded-md border border-line bg-card p-5 shadow-card">
                    <p className="text-xs font-semibold uppercase tracking-wider text-bronze-ink mb-3">
                      Tiến trình lịch sử
                    </p>
                    <ol className="relative ml-2 border-l border-line space-y-4">
                      {periods.slice(0, 4).map((p) => (
                        <li key={p.id} className="relative pl-5">
                          <span
                            className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-seal"
                            aria-hidden="true"
                          />
                          <p className="font-serif text-sm font-semibold text-seal">
                            {formatPeriodYears(p.startYear, p.endYear)}
                          </p>
                          <p className="text-xs text-ink-soft">{p.name}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </section>

            {/* ─── 2. Chọn lớp của bạn: Lớp 4-12 nhóm theo cấp học, link /lessons?grade=<id> ─── */}
            {educationLevels.length > 0 && (
              <section aria-labelledby="grade-selection-title" className="space-y-6">
                <div>
                  <div className="h-[5px] w-16 border-y border-bronze" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-bronze-ink">
                    Chương trình giáo dục
                  </p>
                  <h2
                    id="grade-selection-title"
                    className="mt-1 font-serif text-2xl md:text-[28px] text-ink"
                  >
                    Chọn lớp của bạn
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {educationLevels.map((level) => (
                    <Card key={level.id} className="p-5 shadow-card flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-line">
                          <GraduationCap size={20} className="text-seal shrink-0" aria-hidden="true" />
                          <h3 className="font-serif text-lg font-bold text-ink">{level.name}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {level.grades.map((grade) => (
                            <Link
                              key={grade.id}
                              href={
                                isAuthenticated
                                  ? `/lessons?grade=${grade.id}`
                                  : `/login?from=${encodeURIComponent(`/lessons?grade=${grade.id}`)}`
                              }
                              className="p-3 text-center rounded-md border border-line bg-paper/60 hover:bg-card hover:border-bronze/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal"
                              title={`Xem bài học ${grade.name}`}
                            >
                              <span className="block font-medium text-sm text-ink">{grade.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <p className="text-xs text-muted">
                  Nội dung được phân bổ theo khung chương trình sách giáo khoa Lịch sử Việt Nam từ lớp 4 đến lớp 12.
                </p>
              </section>
            )}

            {/* ─── 3. Dòng thời gian các giai đoạn (nếu có dữ liệu) ─── */}
            {periods.length > 0 && (
              <section aria-labelledby="periods-title" className="space-y-6">
                <div>
                  <div className="h-[5px] w-16 border-y border-bronze" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-bronze-ink">
                    Tiến trình lịch sử
                  </p>
                  <h2 id="periods-title" className="mt-1 font-serif text-2xl md:text-[28px] text-ink">
                    Các thời kỳ dựng nước và giữ nước
                  </h2>
                </div>

                <div className="flex overflow-x-auto pb-3 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
                  {periods.map((p) => {
                    const years = formatPeriodYears(p.startYear, p.endYear);
                    return (
                      <div
                        key={p.id}
                        className="min-w-[200px] sm:min-w-0 p-4 rounded-md border border-line bg-card shadow-card flex flex-col justify-between"
                      >
                        {years && (
                          <span className="block font-serif text-xs font-semibold text-seal mb-1">
                            {years}
                          </span>
                        )}
                        <h3 className="font-serif font-bold text-ink text-base line-clamp-1">
                          {p.name}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ─── 4. Bài học mới: Chỉ hiển thị khi đã đăng nhập (ẩn khi chưa đăng nhập) ─── */}
            {isAuthenticated && latestLessons.length > 0 && (
              <section aria-labelledby="latest-lessons-title" className="space-y-6">
                <div className="flex items-end justify-between flex-wrap gap-4">
                  <div>
                    <div className="h-[5px] w-16 border-y border-bronze" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-bronze-ink">
                      Khám phá tư liệu
                    </p>
                    <h2
                      id="latest-lessons-title"
                      className="mt-1 font-serif text-2xl md:text-[28px] text-ink"
                    >
                      Bài học mới nhất
                    </h2>
                  </div>

                  <Link
                    href="/lessons"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-sm"
                  >
                    <Button variant="ghost" size="sm" className="text-seal hover:text-seal-dark gap-1.5">
                      <span>Xem tất cả bài học</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestLessons.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))}
                </div>
              </section>
            )}

            {/* ─── 5. Giới thiệu các tính năng THẬT học sinh dùng được hôm nay ─── */}
            <section aria-labelledby="features-title" className="space-y-6">
              <div>
                <div className="h-[5px] w-16 border-y border-bronze" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-bronze-ink">
                  Phương pháp học tập
                </p>
                <h2 id="features-title" className="mt-1 font-serif text-2xl md:text-[28px] text-ink">
                  Nội dung học lịch sử trọng tâm
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 shadow-card space-y-3">
                  <div className="w-10 h-10 rounded-md bg-seal/10 text-seal flex items-center justify-center">
                    <BookOpen size={22} aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink">Bài học đa phương tiện</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Nội dung bài đọc được biên soạn cẩn trọng bám sát SGK, tích hợp tranh ảnh tư liệu, lược đồ lịch
                    sử, âm thanh và video tài liệu trực quan giúp việc học lịch sử trở nên sinh động và sâu sắc.
                  </p>
                </Card>

                <Card className="p-6 shadow-card space-y-3">
                  <div className="w-10 h-10 rounded-md bg-bronze/10 text-bronze-ink flex items-center justify-center">
                    <Layers size={22} aria-hidden="true" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-ink">Phân loại theo khối lớp & độ khó</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Hệ thống bài học được phân chia rõ ràng theo từng khối lớp từ lớp 4 đến lớp 12 cùng các cấp độ
                    cơ bản, trung bình và nâng cao, giúp học sinh nhanh chóng tra cứu và học đúng trọng tâm.
                  </p>
                </Card>
              </div>
            </section>

            {/* ─── 6. Lời mời hành động cuối trang ─── */}
            <section className="rounded-lg border border-line bg-card p-8 sm:p-12 text-center shadow-card space-y-4">
              <div className="h-[5px] w-16 border-y border-bronze mx-auto" aria-hidden="true" />
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                Sẵn sàng khám phá lịch sử nước nhà?
              </h2>
              <p className="text-sm sm:text-base text-muted max-w-lg mx-auto leading-relaxed">
                Bắt đầu hành trình tìm hiểu những trang sử vẻ vang của dân tộc Việt Nam qua từng bài học
                chọn lọc ngay hôm nay.
              </p>
              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href={isAuthenticated ? '/lessons' : '/register'}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md"
                >
                  <Button variant="primary" size="lg" className="gap-2">
                    <span>Bắt đầu học ngay</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
                <Link
                  href={isAuthenticated ? '/lessons' : '/login?from=/lessons'}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal rounded-md"
                >
                  <Button variant="secondary" size="lg">
                    <span>Xem toàn bộ bài học</span>
                  </Button>
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ─── Footer dùng chung ─── */}
      <Footer />
    </div>
  );
}
