import Link from 'next/link';
import { GraduationCap, BookOpen, Zap, Trophy, Users, Star, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      {/* ─── Navbar (public version) ─── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container-page">
          <div style={{ display: 'flex', alignItems: 'center', height: 64, gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'linear-gradient(135deg, var(--brand-500), var(--brand-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GraduationCap size={18} color="white" />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.0625rem' }}>
                Học Lịch Sử
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <Link href="/login" id="home-login-btn" className="btn btn-ghost btn-sm">Đăng nhập</Link>
            <Link href="/register" id="home-register-btn" className="btn btn-primary btn-sm">Bắt đầu miễn phí</Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section style={{
        background: 'linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #f0f4ff 100%)',
        padding: 'clamp(4rem, 10vw, 8rem) 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle at 2px 2px, var(--brand-500) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="container-page" style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.375rem 1rem',
            background: 'var(--brand-50)', border: '1.5px solid var(--brand-200)',
            borderRadius: 100, marginBottom: '1.5rem',
            fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-700)',
          }}>
            <Star size={14} fill="currentColor" /> Nền tảng học lịch sử số 1 Việt Nam
          </div>

          <h1 style={{
            fontSize: 'clamp(2.25rem, 8vw, 4.5rem)',
            fontWeight: 900, lineHeight: 1.1,
            marginBottom: '1.5rem',
            letterSpacing: '-0.03em',
          }}>
            Học lịch sử{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--brand-500), #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              theo cách thú vị
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'var(--muted)', maxWidth: 600,
            margin: '0 auto 2.5rem',
            lineHeight: 1.7,
          }}>
            Khám phá lịch sử Việt Nam qua các bài học tương tác, quiz thử thách và hệ thống 
            thu thập thẻ nhân vật hấp dẫn. Dành cho học sinh từ lớp 4 đến lớp 12.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" id="hero-register-btn" className="btn btn-primary btn-lg">
              Bắt đầu miễn phí <ArrowRight size={18} />
            </Link>
            <Link href="/learning" id="hero-browse-btn" className="btn btn-outline btn-lg">
              Xem bài học
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: 'clamp(2rem, 5vw, 4rem)',
            justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '3.5rem', paddingTop: '2.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            {[
              { value: '1,200+', label: 'Học sinh đang học' },
              { value: '50+', label: 'Bài học chất lượng' },
              { value: '200+', label: 'Câu hỏi quiz' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--brand-600)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ padding: 'clamp(4rem, 8vw, 6rem) 0', background: 'var(--background)' }}>
        <div className="container-page">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Tại sao chọn Học Lịch Sử?
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1.0625rem', maxWidth: 520, margin: '0 auto' }}>
              Được thiết kế theo chương trình giáo dục quốc gia, kết hợp công nghệ hiện đại
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {[
              {
                icon: BookOpen, color: 'var(--brand-500)', bg: 'var(--brand-50)',
                title: 'Bài học theo chương trình',
                desc: 'Nội dung bám sát SGK, được biên soạn bởi giáo viên có kinh nghiệm. Phân chia theo lớp và chủ đề rõ ràng.',
              },
              {
                icon: Zap, color: '#f59e0b', bg: '#fffbeb',
                title: 'Quiz thử thách',
                desc: 'Kiểm tra kiến thức sau mỗi bài học với hệ thống quiz đa dạng. Nhận điểm EXP khi hoàn thành.',
              },
              {
                icon: Trophy, color: '#10b981', bg: '#ecfdf5',
                title: 'Thu thập thẻ lịch sử',
                desc: 'Mở khóa thẻ nhân vật và sự kiện lịch sử độc đáo. Xây dựng bộ sưu tập riêng của bạn.',
              },
              {
                icon: Star, color: '#8b5cf6', bg: '#f5f3ff',
                title: 'Hệ thống cấp độ',
                desc: 'Tích lũy EXP, lên cấp và hoàn thành nhiệm vụ hàng ngày để duy trì thói quen học tập.',
              },
              {
                icon: Users, color: '#ec4899', bg: '#fdf2f8',
                title: 'Phù hợp lớp 4–12',
                desc: 'Nội dung được cá nhân hóa theo lớp học. Từ tiểu học đến THPT, đều có bài học phù hợp.',
              },
              {
                icon: GraduationCap, color: 'var(--brand-600)', bg: 'var(--brand-50)',
                title: 'AI hỗ trợ học tập',
                desc: 'Hỏi AI về bất kỳ sự kiện hay nhân vật lịch sử nào. Nhận giải thích chi tiết ngay lập tức.',
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="card card-hover" style={{ padding: '1.5rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <Icon size={24} color={color} />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.0625rem' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{
        padding: 'clamp(4rem, 8vw, 6rem) 0',
        background: 'linear-gradient(135deg, var(--brand-600), #7c3aed)',
        textAlign: 'center',
        color: 'white',
      }}>
        <div className="container-page">
          <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem' }}>
            Sẵn sàng bắt đầu chưa?
          </h2>
          <p style={{ fontSize: '1.0625rem', opacity: 0.85, marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
            Tham gia ngay hôm nay. Miễn phí hoàn toàn, không cần thẻ tín dụng.
          </p>
          <Link href="/register" id="cta-register-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 2rem',
            background: 'white', color: 'var(--brand-700)',
            borderRadius: 12, fontWeight: 700, fontSize: '1.0625rem',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s ease',
          }}>
            Tạo tài khoản miễn phí <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '2rem 0',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.9rem',
      }}>
        <div className="container-page">
          <p>© 2026 Học Lịch Sử. Được xây dựng với ❤️ cho học sinh Việt Nam.</p>
        </div>
      </footer>
    </>
  );
}
