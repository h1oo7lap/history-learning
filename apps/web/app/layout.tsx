import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

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
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
