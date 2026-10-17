'use client';

import type { CSSProperties } from 'react';
import { GraduationCap } from 'lucide-react';

// Bộ sinh số giả ngẫu nhiên có hạt giống: cùng seed thì cùng kết quả,
// nên server và trình duyệt tạo ra đúng cùng một bộ sao (hết lỗi hydration).
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, digits = 2) => Number(n.toFixed(digits));

export const STARS = (() => {
  const rand = mulberry32(20261006);
  return Array.from({ length: 60 }, () => ({
    left: `${round(rand() * 100)}%`,
    top: `${round(rand() * 100)}%`,
    duration: `${round(2 + rand() * 4)}s`,
    delay: `${round(rand() * 3)}s`,
    maxOpacity: String(round(0.3 + rand() * 0.7)),
  }));
})();

export function AuthHeroContent() {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '3rem',
        textAlign: 'center',
        maxWidth: 480,
      }}
    >
      {/* Stars */}
      <div className="auth-stars">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="auth-star"
            style={
              {
                left: s.left,
                top: s.top,
                '--duration': s.duration,
                '--delay': s.delay,
                '--max-opacity': s.maxOpacity,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: 'linear-gradient(135deg, rgba(90, 114, 247, 0.5), rgba(139, 92, 246, 0.4))',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            backdropFilter: 'blur(8px)',
          }}
        >
          <GraduationCap size={48} color="white" strokeWidth={1.5} />
        </div>

        <h2
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: 'white',
            marginBottom: '1rem',
          }}
        >
          Khám phá <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #7c9dff, #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Lịch Sử Việt Nam
          </span>
        </h2>

        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.7,
            fontSize: '1.0625rem',
            marginBottom: '2.5rem',
          }}
        >
          Nền tảng học lịch sử tương tác dành cho học sinh từ lớp 4 đến lớp 12. Học bài, làm quiz và
          thu thập thẻ nhân vật lịch sử.
        </p>

        {/* Feature pills */}
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', justifyContent: 'center' }}
        >
          {[
            '📚 Bài học phong phú',
            '🧩 Quiz tương tác',
            '🃏 Thu thập thẻ',
            '🎯 Nhiệm vụ hàng ngày',
          ].map((f) => (
            <span
              key={f}
              style={{
                padding: '0.375rem 0.875rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 100,
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.875rem',
                backdropFilter: 'blur(4px)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export { AuthHeroContent as AuthHero };
