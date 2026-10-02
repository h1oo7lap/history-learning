import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bảng điều khiển',
  description: 'Theo dõi tiến độ học tập, nhiệm vụ hàng ngày và thành tích của bạn.',
};

export default function DashboardPage() {
  return (
    <div className="container-page" style={{ padding: '2rem clamp(1rem, 4vw, 2rem)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Bảng điều khiển
        </h1>
        <p style={{ color: 'var(--muted)' }}>Tổng quan về tiến độ học tập của bạn</p>
      </div>

      {/* Placeholder cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {[
          { icon: '📚', title: 'Bài học đã học', value: '0', sub: 'bài học' },
          { icon: '⭐', title: 'Điểm EXP', value: '0', sub: 'điểm kinh nghiệm' },
          { icon: '🎯', title: 'Nhiệm vụ hoàn thành', value: '0', sub: 'nhiệm vụ' },
          { icon: '🃏', title: 'Thẻ sưu tập', value: '0', sub: 'thẻ lịch sử' },
        ].map(card => (
          <div key={card.title} className="card card-hover" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{card.icon}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.375rem' }}>
              {card.title}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '2rem', marginTop: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏗️</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Dashboard đang được xây dựng
        </h2>
        <p style={{ color: 'var(--muted)' }}>
          Tính năng đầy đủ sẽ ra mắt ở Week 7. Hiện tại bạn có thể khám phá các tính năng khác.
        </p>
      </div>
    </div>
  );
}
