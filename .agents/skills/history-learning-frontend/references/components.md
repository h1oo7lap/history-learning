# Đặc tả component dùng chung (`apps/web/components/ui/`)
Mỗi component: nhận `className` để mở rộng, dùng `cn()` từ `lib/cn.ts`, có kiểu TS rõ ràng, không `any`. Không logic gọi API trong `ui`.

## Button
- Biến thể: `primary` (nền seal, chữ paper), `secondary` (viền ink, nền trong), `ghost` (chữ ink, hover nền line/40), `danger`.
- Cỡ: `sm` cao 36, `md` cao 44 (mặc định, đủ vùng chạm), `lg` cao 52. Bo `rounded-md`, chữ 15-16px độ đậm 600.
- Trạng thái: hover đậm hơn, `focus-visible:ring-2 ring-seal ring-offset-2 ring-offset-paper`, `disabled:opacity-50`, `loading` (spinner + `aria-busy`, giữ nguyên chiều rộng).
- Là `<button>`; nếu điều hướng dùng `<Link>` có cùng kiểu (prop `asChild` hoặc hàm `buttonStyles()`).

## Card
- `bg-card border border-line rounded-md shadow-card`, padding 16-24. Thẻ nhấn được: hover đổi viền sang bronze, KHÔNG nhảy lên/phóng to. Toàn thẻ là một link duy nhất, không lồng link trong link.

## Badge
- Cao 24, chữ 13px, `rounded-sm`, nền line/60, chữ ink-soft. Biến thể trạng thái (đã xuất bản, bản nháp, lưu trữ) dùng màu success/bronze-ink/muted kèm chữ, không chỉ dựa vào màu.

## Input / Select / Textarea / Label / FieldError
- Cao 44, nền card, viền line, `rounded-sm`, focus: viền seal + ring. Nhãn luôn nằm trên ô (không dùng placeholder thay nhãn). Lỗi: chữ danger 14px ngay dưới ô, `aria-invalid` và `aria-describedby`.
- Tích hợp react-hook-form qua một `FormField` bọc, không lặp mã.

## Skeleton
- Khối nền line/60 `animate-pulse` (tắt khi reduced-motion) có hình dạng đúng nội dung (thẻ bài học, dòng bảng, đoạn văn). Không dùng một spinner giữa trang trống.

## EmptyState / ErrorState
- Rỗng: biểu tượng lucide cỡ 32 màu muted, một câu giải thích, một nút hành động (ví dụ "Xóa bộ lọc", "Quay lại danh sách"). Lỗi: câu dễ hiểu, nút "Thử lại" gọi `refetch`, không hiện stack/mã lỗi thô.

## PageHeader
- Tiêu đề h1 serif, mô tả ngắn muted, vùng hành động bên phải; có breadcrumb khi sâu hơn 2 cấp.

## Navbar (công khai/người dùng)
- Cao 64, nền paper, viền dưới line, không blur/gradient. Trái: logo chữ (serif) + (tùy chọn) biểu tượng nhỏ. Giữa/phải: Bài học, Lịch sử theo dòng thời gian (nếu có), Hỏi đáp AI (khi có). Phải: Đăng nhập (ghost) + Bắt đầu (primary) khi chưa đăng nhập; menu người dùng khi đã đăng nhập.
- Mục đang mở có gạch chân dày 2px màu seal và `aria-current="page"`.
- Mobile: nút menu 44px mở bảng điều hướng toàn chiều rộng, đóng được bằng Esc, giữ focus trong bảng, khóa cuộn nền.
- Dùng CHUNG một Navbar cho trang chủ và các trang khác (hiện trang chủ tự vẽ navbar riêng bằng style inline: bỏ).

## LessonCard
- Ảnh bìa tỉ lệ 16:10 (có ảnh dự phòng), dưới là: dòng nhỏ (Lớp · Giai đoạn), tiêu đề serif tối đa 2 dòng, tóm tắt tối đa 2 dòng, cuối: thời gian đọc + độ khó bằng chữ. Không hiện thẻ tag dài; tối đa 2 nhãn.
- Thẻ là một link. Lưới: 1 cột mobile, 2 cột tablet, 3 cột desktop, khoảng cách 24.

## Dialog / ConfirmDialog
- Dùng `<dialog>` hoặc thư viện đã có; tiêu đề, mô tả, nút hủy (secondary) trái, nút xác nhận phải; hành động phá hủy dùng `danger`; Esc đóng; trả focus về nút mở.

## Toast
- Dùng `sonner` đã có; chỉ cho phản hồi hành động (đã lưu, lỗi mạng). Màu theo token.

## Bảng admin (DataTable)
- Giữ chức năng đã có; chuẩn hóa: tiêu đề cột 13px muted in hoa nhẹ hoặc đậm vừa, dòng cao 48, viền ngang line, hover nền line/30, có skeleton/rỗng/lỗi. Admin được phép dày thông tin hơn trang học sinh nhưng dùng chung token.
