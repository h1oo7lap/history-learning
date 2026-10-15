import type { Metadata } from 'next';
import { Source_Serif_4, Be_Vietnam_Pro } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const serif = Source_Serif_4({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif-src',
  display: 'swap',
});

const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-src',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Học Lịch Sử - Nền tảng học lịch sử Việt Nam',
    template: '%s | Học Lịch Sử',
  },
  description:
    'Nền tảng học lịch sử Việt Nam cho học sinh từ lớp 4 đến lớp 12. Học bài, làm bài kiểm tra và thu thập thẻ lịch sử.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

