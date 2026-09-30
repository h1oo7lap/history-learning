import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Học Lịch Sử - Trang chủ',
  description: 'Bắt đầu hành trình học lịch sử Việt Nam cùng chúng tôi',
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-center mb-4">Học Lịch Sử</h1>
      <p className="text-lg text-center text-gray-600 mb-8">
        Nền tảng học lịch sử Việt Nam cho học sinh từ lớp 4 đến lớp 12
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Đăng nhập
        </a>
        <a
          href="/register"
          className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
        >
          Đăng ký
        </a>
      </div>
    </main>
  );
}
