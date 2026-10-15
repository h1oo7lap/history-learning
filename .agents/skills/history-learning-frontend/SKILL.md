---
name: history-learning-frontend
description: Thiết kế và code giao diện (Next.js 16, Tailwind 4, TanStack Query) cho History Learning với phong cách "trang sách sử" nhất quán. Dùng MỖI KHI tạo/sửa trang, component, style, layout, navbar, form, hoặc khi giao diện xấu, lệch, nhìn như template AI. Frontend, UI, UX, CSS, Tailwind, responsive, đẹp hơn.
---
# Frontend History Learning

**Sửa lỗi nhỏ / chỉnh style 1-2 file:** chỉ cần tuân thủ "Quy tắc cứng" (token, không hex/inline mới, đủ trạng thái, a11y cơ bản) và chạy lint + typecheck. Bỏ qua lộ trình chuyển đổi, chụp 3 kích thước và báo cáo dài. Mục "Cách làm một trang/component" và "Lộ trình" chỉ dùng khi làm hoặc làm lại cả trang/component.

Mục tiêu: giao diện cho học sinh lớp 4-12 học lịch sử. Cảm giác: sách sử được làm đẹp và hiện đại, ấm, dễ đọc, đáng tin. KHÔNG phải landing page SaaS.

Đọc thêm khi cần (không đọc hết mỗi lần):
- `references/design-system.md`: token, font, thang chữ, khối `@theme` copy dùng ngay.
- `references/components.md`: đặc tả Button, Card, Badge, Input, Navbar, LessonCard, EmptyState, Skeleton...
- `references/page-patterns.md`: bố cục từng loại trang (trang chủ, danh sách bài, đọc bài, dashboard, quiz, chat AI, admin).
- `references/review-checklist.md`: danh sách tự kiểm tra trước khi báo xong.
- `scripts/audit-ui.sh`: quét nhanh lỗi phổ biến. Chạy từ gốc repo: `bash .agents/skills/history-learning-frontend/scripts/audit-ui.sh`.

## Hiện trạng cần biết (đã đo trên repo)
- `app/globals.css` ~1.280 dòng class viết tay + ~570 chỗ `style={{...}}` trong TSX. Tailwind được import nhưng gần như không dùng, chưa có `@theme`.
- Chưa có font nạp thật (dòng font bị comment) nên trình duyệt dùng font hệ thống.
- Bảng màu tím-xanh (`--brand-*` #5a72f7), gradient, chữ gradient. Đây là nguồn của cảm giác "template AI".
- Chưa có `components/ui`. Dark mode bật theo hệ thống nhưng nhiều chỗ nền trắng cứng nên bị lệch.
- Có câu quảng cáo bịa ("số 1 Việt Nam").
Khi sửa, đi từng bước theo "Lộ trình chuyển đổi" bên dưới, KHÔNG viết lại toàn bộ một lần.

## Hướng thiết kế
- Nền giấy ấm, chữ mực, một màu nhấn đỏ son dùng tiết chế (nút chính, liên kết, dấu nhấn). Vàng đồng chỉ để trang trí/viền/đường kẻ, không dùng làm màu chữ nhỏ.
- Tiêu đề và nội dung bài đọc dùng serif; giao diện (nút, nhãn, bảng, menu) dùng sans.
- Khác biệt tạo bằng: chữ đẹp, khoảng trắng, đường kẻ mảnh, tư liệu hình ảnh thật (tranh, bản đồ, dòng thời gian), không bằng gradient, bóng đổ nặng hay bo góc lớn.
- Mỗi trang có MỘT ý tưởng thị giác rõ ràng, không phải lưới thẻ giống nhau chồng nhau.
- Chỉ light mode ở v1. Bỏ `prefers-color-scheme: dark` cho đến khi có thời gian làm đúng cho cả site.

## Quy tắc cứng (vi phạm là lỗi)
1. Màu, cỡ chữ, bo góc, bóng, khoảng cách lấy từ token (`@theme`). Cấm mã hex và `style={{}}` cho màu/khoảng cách trong component. Ngoại lệ: giá trị động thật sự (width theo %).
2. Ưu tiên tiện ích Tailwind + component dùng chung trong `components/ui`. Không thêm class mới vào `globals.css` (chỉ base, token, và phần typography nội dung bài đọc).
3. Không gradient trang trí, không chữ gradient, không bóng màu, không "glassmorphism", không blob/đốm sáng.
4. Không emoji làm icon. Dùng `lucide-react`, kích thước và độ dày nét thống nhất.
5. Không bịa số liệu, xếp hạng, lời chứng thực, huy hiệu. Chỉ hiển thị dữ liệu thật từ API hoặc bỏ phần đó. Không viết "số 1", "hàng đầu", "miễn phí 100%" nếu không có căn cứ.
6. Nhãn cho người dùng, không lộ mã nội bộ: "Lớp 4" không phải `GRADE_4`, "Dễ/Trung bình/Khó" không phải enum. Dùng bảng ánh xạ trong `lib/format.ts`.
7. Mọi dữ liệu từ API có đủ 3 trạng thái: đang tải (skeleton đúng hình dạng nội dung), rỗng (câu giải thích + hành động tiếp theo), lỗi (thông báo dễ hiểu + nút thử lại).
8. Mọi `<img>`: có `alt` có nghĩa, tỉ lệ khung cố định (`aspect-*`), ảnh dự phòng khi lỗi tải, `loading="lazy"` trừ ảnh đầu trang. Link Cloudinary thêm `f_auto,q_auto` và chiều rộng hợp lý.
9. Văn bản tiếng Việt: kiểm tra dấu hiển thị đúng ở mọi cỡ chữ (font hỗ trợ subset `vietnamese`), không cắt chữ bằng `truncate` ở tiêu đề quan trọng khi có thể xuống dòng.
10. Truy cập: tương phản AA, vòng focus thấy rõ, vùng chạm ≥ 44px, dùng được bằng bàn phím, `<button>` cho hành động và `<a>` cho điều hướng, một `<h1>` mỗi trang, thứ tự tiêu đề đúng.
11. Responsive: kiểm tra 360, 768, 1440 px, không cuộn ngang. Thiết kế mobile trước.
12. Mã: không `any`; không gọi `setState` đồng bộ trong `useEffect` (dùng `key`, state khởi tạo từ props, hoặc giá trị dẫn xuất); dữ liệu qua hook TanStack Query trong `features/*`; trang công khai ưu tiên Server Component; không `dangerouslySetInnerHTML` ngoài sanitizer, nội dung `contentJson` render bằng React element.
13. Đọc `apps/web/AGENTS.md` và tài liệu trong `node_modules/next/dist/docs/` khi dùng API Next.js (phiên bản này khác kiến thức cũ).

## Cách làm một trang/component
1. Đọc trang hiện tại và các component `components/ui` đã có. Mô tả ngắn: người dùng làm gì ở trang này, thông tin nào quan trọng nhất.
2. Dùng lại component có sẵn; thiếu thì tạo trong `components/ui` theo `references/components.md`.
3. Viết bằng Tailwind + token. Xử lý đủ 3 trạng thái dữ liệu.
4. `bash .../audit-ui.sh` và sửa lỗi trong phạm vi file đã đụng.
5. `pnpm --filter web lint`, `typecheck`, `build`.
6. Chụp màn hình 360/768/1440 bằng Playwright, tự nhìn lại theo `references/review-checklist.md`, rồi báo: đã đổi gì, cải thiện gì, còn gì chưa làm.

## Lộ trình chuyển đổi (mỗi bước một lượt riêng, chờ duyệt)
1. Nền: nạp font bằng `next/font`, thêm `@theme` (token), bỏ dark mode, base typography. Chưa đụng trang.
2. `components/ui`: Button, Card, Badge, Input/Select/Label, Skeleton, EmptyState, ErrorState, PageHeader. Có trang `/dev/ui` hoặc story nhỏ để xem.
3. Khung: Navbar, Footer, layout công khai/người dùng/admin dùng chung component.
4. Trang theo thứ tự ưu tiên: danh sách bài → đọc bài → trang chủ → đăng nhập/đăng ký → dashboard → admin.
5. Dọn `globals.css`: xóa class không còn dùng; mục tiêu < 200 dòng. Xóa file SVG mặc định của Next trong `public/` nếu không dùng.
Sau mỗi bước phải build được và không làm vỡ trang chưa chuyển.
