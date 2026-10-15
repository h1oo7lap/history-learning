'use client';

import { notFound } from 'next/navigation';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Select,
  Label,
  FieldError,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from '@/components/ui';
import { BookOpen, Search, Sparkles } from 'lucide-react';

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper text-ink p-4 sm:p-8 md:p-12 max-w-6xl mx-auto space-y-12">
      {/* ─── Page Header ─── */}
      <PageHeader
        title="Bảng Linh Kiện Giao Diện (UI Showcase)"
        description="Đặc tả các thành phần giao diện theo hệ thiết kế 'trang sách sử' của History Learning. Dùng để kiểm thử hiển thị, biến thể và độ tương thích responsive."
        breadcrumbs={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Phát triển' },
          { label: 'Thư viện UI' },
        ]}
        actions={
          <Button variant="primary" size="sm">
            <Sparkles size={16} />
            <span>Chế độ kiểm thử</span>
          </Button>
        }
      />

      {/* ─── 1. Bảng màu Tokens ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          1. Bảng màu chuẩn (Design Tokens)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: 'paper', hex: '#FAF6EE', bg: 'bg-paper', border: 'border border-line', text: 'text-ink' },
            { name: 'card', hex: '#FFFDF8', bg: 'bg-card', border: 'border border-line', text: 'text-ink' },
            { name: 'ink', hex: '#1F1B16', bg: 'bg-ink', text: 'text-paper' },
            { name: 'ink-soft', hex: '#3A332B', bg: 'bg-ink-soft', text: 'text-paper' },
            { name: 'muted', hex: '#6B6155', bg: 'bg-muted', text: 'text-paper' },
            { name: 'seal', hex: '#9B2C2C', bg: 'bg-seal', text: 'text-paper' },
            { name: 'seal-dark', hex: '#7F2222', bg: 'bg-seal-dark', text: 'text-paper' },
            { name: 'bronze', hex: '#B7791F', bg: 'bg-bronze', text: 'text-paper' },
            { name: 'bronze-ink', hex: '#8A5A12', bg: 'bg-bronze-ink', text: 'text-paper' },
            { name: 'line', hex: '#E4DACA', bg: 'bg-line', text: 'text-ink' },
            { name: 'success', hex: '#2F6B3F', bg: 'bg-success', text: 'text-paper' },
            { name: 'danger', hex: '#B42318', bg: 'bg-danger', text: 'text-paper' },
          ].map((token) => (
            <div
              key={token.name}
              className={`p-3 rounded-md flex flex-col justify-between h-20 ${token.bg} ${token.border ?? ''} shadow-card`}
            >
              <span className={`text-xs font-semibold ${token.text}`}>{token.name}</span>
              <span className={`text-[11px] opacity-80 ${token.text}`}>{token.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 2. Typography ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          2. Kiểu chữ (Typography)
        </h2>
        <Card className="p-6 space-y-4">
          <div>
            <span className="text-xs text-muted block mb-1">Display / Tiêu đề chính (Serif - Source Serif 4)</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              Lịch sử hào hùng dân tộc Việt Nam
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted block mb-1">Mục tiêu bài học (h2)</span>
              <h2 className="font-serif text-2xl font-bold text-ink">Chiến thắng Bạch Đằng năm 938</h2>
            </div>
            <div>
              <span className="text-xs text-muted block mb-1">Tiểu mục (h3)</span>
              <h3 className="font-serif text-xl font-semibold text-ink">Kế sách cắm cọc gỗ trên sông</h3>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted block mb-1">Đoạn văn đọc sách sử (Serif 18px / line-height 1.75)</span>
            <p className="font-serif text-[18px] leading-[1.75] text-ink max-w-[68ch]">
              Ngô Quyền truyền đóng cọc nhọn đầu bịt sắt ở vùng cửa biển hiểm yếu. Khi nước triều lên, thuyền giặc tiến vào lòng sông; lúc triều rút nhanh, quân ta quay đầu đánh quyết liệt, làm thuyền giặc vướng cọc đắm vô kể.
            </p>
          </div>
          <div>
            <span className="text-xs text-muted block mb-1">Giao diện người dùng (Sans - Be Vietnam Pro)</span>
            <p className="font-sans text-sm text-ink-soft">
              Ấn Độ, ươ, ễ, ặ, ỳ — Kiểm tra hiển thị dấu thanh tiếng Việt đầy đủ và trang trọng.
            </p>
          </div>
        </Card>
      </section>

      {/* ─── 3. Button ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          3. Nút bấm (Button)
        </h2>
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted block">Biến thể (Variants):</span>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Nút chính (Primary)</Button>
              <Button variant="secondary">Nút viền (Secondary)</Button>
              <Button variant="ghost">Nút mờ (Ghost)</Button>
              <Button variant="danger">Nút nguy hiểm (Danger)</Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted block">Kích thước (Sizes):</span>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="sm">Cỡ nhỏ (sm: 36px)</Button>
              <Button size="md">Mặc định (md: 44px)</Button>
              <Button size="lg">Cỡ lớn (lg: 52px)</Button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted block">Trạng thái (States):</span>
            <div className="flex flex-wrap gap-3 items-center">
              <Button loading>Đang tải</Button>
              <Button disabled>Vô hiệu hóa</Button>
              <Button variant="secondary" disabled>Vô hiệu viền</Button>
              <Button variant="primary">
                <BookOpen size={16} />
                <span>Kèm biểu tượng</span>
              </Button>
              <Button asChild variant="secondary">
                <a href="#test-link">Dạng Link</a>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ─── 4. Badge ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          4. Huy hiệu (Badge)
        </h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Badge variant="default">Mặc định</Badge>
            <Badge variant="default" dot>Mặc định (chấm)</Badge>
            <Badge variant="success" dot>Đã xuất bản</Badge>
            <Badge variant="warning" dot>Bản nháp</Badge>
            <Badge variant="danger" dot>Đã khóa</Badge>
            <Badge variant="neutral">Lưu trữ</Badge>
            <Badge variant="neutral" dot>Lớp 10</Badge>
          </div>
        </Card>
      </section>

      {/* ─── 5. Form Controls ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          5. Trường nhập liệu (Form Controls)
        </h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div>
              <Label htmlFor="input-standard" required>Họ và tên học sinh</Label>
              <Input id="input-standard" placeholder="Nguyễn Văn An" />
            </div>

            <div>
              <Label htmlFor="select-grade" required>Lớp học</Label>
              <Select id="select-grade" defaultValue="10">
                <option value="4">Lớp 4 - Tiểu học</option>
                <option value="5">Lớp 5 - Tiểu học</option>
                <option value="10">Lớp 10 - THPT</option>
                <option value="11">Lớp 11 - THPT</option>
                <option value="12">Lớp 12 - THPT</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="input-error" required>Địa chỉ Email</Label>
              <Input
                id="input-error"
                type="email"
                defaultValue="invalid-email"
                error
                aria-describedby="email-error-msg"
              />
              <FieldError id="email-error-msg" message="Địa chỉ email không đúng định dạng." />
            </div>

            <div>
              <Label htmlFor="input-disabled">Tên đăng nhập (Khóa)</Label>
              <Input id="input-disabled" defaultValue="student_vietnam_01" disabled />
            </div>
          </div>
        </Card>
      </section>

      {/* ─── 6. Card & Containers ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          6. Thẻ nội dung (Card)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thẻ tiêu chuẩn</CardTitle>
              <CardDescription>Thẻ tĩnh dùng hiển thị thông tin hoặc bảng biểu.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-soft">
                Nền giấy thẻ #FFFDF8, viền đường kẻ #E4DACA mảnh, bóng nhẹ shadow-card.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="neutral">Thông tin</Badge>
            </CardFooter>
          </Card>

          <Card interactive>
            <CardHeader>
              <CardTitle>Thẻ tương tác (Interactive)</CardTitle>
              <CardDescription>Hover sẽ đổi viền sang màu đồng bronze.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-soft">
                Rê chuột lên thẻ này để thấy viền chuyển sang bronze ấm, không phóng to hay nhảy giật.
              </p>
            </CardContent>
            <CardFooter>
              <Badge variant="warning" dot>Hover thử</Badge>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thẻ có hành động</CardTitle>
              <CardDescription>Kết hợp nút bấm ở chân thẻ.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-soft">
                Các nút bấm và nhãn trong thẻ tuân thủ chuẩn tỷ lệ và padding 16-24px.
              </p>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-xs text-muted">Thời gian: 15 phút</span>
              <Button variant="secondary" size="sm">Bắt đầu học</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* ─── 7. Skeleton Loading ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          7. Khối tải dữ liệu (Skeleton)
        </h2>
        <Card className="p-6">
          <div className="space-y-4 max-w-md">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-28 w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </Card>
      </section>

      {/* ─── 8. Feedback States ─── */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-ink border-b border-line pb-2">
          8. Trạng thái phản hồi (EmptyState & ErrorState)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmptyState
            icon={Search}
            title="Chưa tìm thấy bài học phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ các bộ lọc theo lớp học và giai đoạn."
            action={{
              label: 'Xóa bộ lọc',
              onClick: () => {},
            }}
          />

          <ErrorState
            title="Không thể tải danh sách bài học"
            description="Hệ thống đang gặp sự cố kết nối máy chủ dữ liệu. Vui lòng kiểm tra đường truyền và thử lại."
            onRetry={() => {}}
          />
        </div>
      </section>
    </main>
  );
}
