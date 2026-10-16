---
name: history-learning-frontend
description: Thiết kế và code giao diện (Next.js 16, Tailwind 4, TanStack Query) cho History Learning với phong cách "trang sách sử" nhất quán. Dùng MỖI KHI tạo/sửa trang, component, style, layout, form, hoặc khi giao diện xấu, lệch, nhìn như template AI. Frontend, UI, UX, CSS, Tailwind, responsive, đẹp hơn.
---
# Frontend History Learning

Mục tiêu: giao diện cho học sinh lớp 4-12 học lịch sử. Cảm giác: sách sử được làm đẹp và hiện đại, ấm, dễ đọc, đáng tin. KHÔNG phải landing page SaaS.

**Sửa lỗi nhỏ / chỉnh style 1-2 file:** chỉ cần tuân thủ "Quy tắc cứng", chạy lint + typecheck, báo 2-3 dòng. Bỏ qua phần "Cách làm một trang", chụp ảnh và báo cáo dài.

Đọc thêm khi cần (không đọc hết mỗi lần):
- `references/design-system.md`: token màu, font, thang chữ, khối `@theme`.
- `references/components.md`: đặc tả Button, Card, Badge, Input, Navbar, LessonCard, Dialog, DataTable...
- `references/page-patterns.md`: bố cục từng loại trang (trang chủ, danh sách, đọc bài, dashboard, quiz, chat AI, admin).
- `references/signature-elements.md`: chi tiết tạo bản sắc sách sử (đường kẻ đôi, timeline, chú thích tư liệu). Đọc khi làm trang nội dung.
- `references/review-checklist.md`: tự kiểm tra trước khi báo xong.
- `scripts/audit-ui.mjs`: quét lỗi phổ biến, chạy mọi hệ điều hành: `node .agents/skills/history-learning-frontend/scripts/audit-ui.mjs <file hoặc thư mục>`.

## Trạng thái chuyển đổi (CẬP NHẬT dòng này khi xong một bước)
Đã xong: font + `@theme` token; bộ `components/ui`; Navbar/Footer/layout dùng chung; trang `/lessons` + `LessonCard`.
Còn lại, theo thứ tự: đọc bài `/lessons/[slug]` → trang chủ → đăng nhập/đăng ký/quên mật khẩu → onboarding chọn lớp + profile → dashboard → admin → dọn `globals.css` (mục tiêu < 200 dòng).
Trang chưa chuyển vẫn còn class cũ và tông tím xanh; đó là việc cần làm, không phải mẫu để bắt chước. Trang mẫu tham chiếu: `/lessons` và `components/ui/*`.

## Hướng thiết kế
- Nền giấy ấm, chữ mực, MỘT màu nhấn đỏ son dùng tiết chế. Vàng đồng chỉ cho viền/đường kẻ/họa tiết; chữ màu đồng dùng `bronze-ink`.
- Tiêu đề và nội dung bài đọc dùng serif; giao diện (nút, nhãn, bảng, menu) dùng sans.
- Bản sắc đến từ chữ đẹp, khoảng trắng, đường kẻ mảnh và tư liệu thật (tranh, bản đồ, timeline), không từ gradient, bóng nặng hay bo góc lớn.
- Mỗi trang một ý tưởng thị giác rõ ràng, không phải lưới thẻ giống nhau chồng nhau.
- Chỉ light mode ở v1.

## Quy tắc cứng (vi phạm là lỗi)
1. Màu, cỡ chữ, bo góc, bóng, khoảng cách lấy từ token (`@theme`) và tiện ích Tailwind. Cấm mã hex và `style={{}}` trừ giá trị động thật sự (width theo %).
2. Dùng lại `components/ui`; thiếu thì tạo ở đó. Không thêm class mới vào `globals.css` (chỉ base, token, và kiểu chữ nội dung bài đọc `.prose-history`).
3. Không gradient, chữ gradient, bóng màu, kính mờ, đốm sáng trang trí.
4. Không emoji làm icon; dùng `lucide-react`, cỡ và nét thống nhất.
5. Không bịa số liệu, xếp hạng, lời chứng thực, khẩu hiệu ("số 1"). Không đặt liên kết tới trang chưa tồn tại.
6. Nhãn cho người dùng, không lộ mã nội bộ (`GRADE_4`, `PUBLISHED`); dùng hàm ánh xạ trong `lib/format.ts`.
7. Mọi dữ liệu từ API có đủ 3 trạng thái: skeleton đúng hình, rỗng (có hành động), lỗi (có thử lại).
8. Mọi `<img>`: `alt` có nghĩa, khung tỉ lệ cố định, ảnh dự phòng khi lỗi, lazy trừ ảnh đầu trang; link Cloudinary qua `optimizeCloudinaryUrl`.
9. Tiếng Việt: dấu hiển thị đúng ở mọi cỡ chữ; không `truncate` tiêu đề quan trọng khi có thể xuống dòng.
10. Truy cập: tương phản AA, vòng focus thấy rõ, vùng chạm ≥ 44px, dùng được bằng bàn phím, `<button>` cho hành động và `<a>` cho điều hướng, một `<h1>` mỗi trang.
11. Responsive: thiết kế mobile trước; kiểm tra 360/768/1440, không cuộn ngang.
12. Mã: không `any`; không `setState` đồng bộ trong `useEffect`; dữ liệu qua hook TanStack Query trong `features/*`; trang công khai ưu tiên Server Component; không `dangerouslySetInnerHTML` ngoài sanitizer; `contentJson` render bằng React element.
13. Khi dùng API Next.js, đọc `apps/web/AGENTS.md` và `node_modules/next/dist/docs/` (phiên bản này khác kiến thức cũ).

## Cách làm một trang/component (việc lớn)
Làm thẳng, không cần dừng chờ duyệt kế hoạch (người dùng duyệt qua ảnh chụp). Chỉ dừng hỏi khi phải đổi dữ liệu/API hoặc có nhiều hướng với hậu quả khác nhau.
1. Đọc trang hiện tại, `components/ui`, và trang mẫu `/lessons`. Xác định: người dùng làm gì ở trang này, thông tin nào quan trọng nhất.
2. Dùng lại component có sẵn; thiếu thì tạo theo `references/components.md`.
3. Viết bằng Tailwind + token, đủ 3 trạng thái dữ liệu, 1-2 chi tiết bản sắc nếu là trang nội dung.
4. Chạy `audit-ui.mjs` trên file đã sửa; `pnpm --filter web lint`, `typecheck`, `build`, `test`.
5. Chụp 360/768/1440, TỰ NHÌN ẢNH theo checklist, sửa rồi mới báo.
6. Xóa class cũ trong `globals.css` thuộc phần đã chuyển (grep xác nhận). Cập nhật dòng "Trạng thái chuyển đổi" ở trên. Không commit.
Báo cáo: file đổi, ảnh chụp, kết quả lệnh, điều chưa làm.
