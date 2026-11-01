---
name: history-learning-frontend
description: Thiết kế và code giao diện (Next.js, Tailwind, TanStack Query) cho History Learning theo phong cách "trang sách sử" nhất quán. Dùng khi tạo mới hoặc thiết kế lại trang hay component, hoặc khi giao diện xấu, lệch, giống template AI. Chỉnh nhỏ một chỗ thì chỉ cần mục "Việc nhỏ".
---
# Frontend

Mục tiêu: giao diện cho học sinh lớp 4–12 học lịch sử. Cảm giác: sách sử được làm đẹp và hiện đại, ấm, dễ đọc, đáng tin. Không phải landing page SaaS.

Trước khi dùng API Next.js, đọc `apps/web/AGENTS.md` và `node_modules/next/dist/docs/` (phiên bản này khác kiến thức cũ).

## Việc nhỏ
Đổi màu, chữ, bố cục một chỗ, ẩn hay bỏ thành phần, sửa lỗi hiển thị: chỉ tuân thủ "Quy tắc cứng" cho phần đang sửa (ví dụ đổi màu thì dùng token, không hex). Không đọc references, không chụp ảnh, không chạy audit hay build; chạy `lint` và `typecheck` rồi báo 2-3 dòng. Phần "Cách làm" chỉ cho việc lớn.

## Tài liệu tham khảo (đọc khi cần, không đọc hết)
- `references/design-system.md`: token màu, font, thang chữ, khối `@theme`.
- `references/components.md`: đặc tả component dùng chung.
- `references/page-patterns.md`: bố cục từng loại trang.
- `references/signature-elements.md`: chi tiết tạo bản sắc sách sử, đọc khi làm trang nội dung.
- `references/review-checklist.md`: tự kiểm tra trước khi báo xong.
- `scripts/audit-ui.mjs`: quét lỗi phổ biến: `node .agents/skills/history-learning-frontend/scripts/audit-ui.mjs <file hoặc thư mục>`.

Trang mẫu tham chiếu: `/lessons` và `components/ui/*`. Trang nào còn class cũ là việc cần chuyển, không phải mẫu.

## Hướng thiết kế
- Nền giấy ấm, chữ mực, MỘT màu nhấn đỏ son dùng tiết chế. Vàng đồng chỉ cho viền, đường kẻ, họa tiết.
- Tiêu đề và nội dung bài đọc dùng serif; giao diện (nút, nhãn, bảng, menu) dùng sans.
- Bản sắc đến từ chữ đẹp, khoảng trắng, đường kẻ mảnh và tư liệu thật (tranh, bản đồ, timeline), không từ gradient, bóng nặng hay bo góc lớn.
- Mỗi trang một ý tưởng thị giác rõ ràng; chỉ light mode.

## Quy tắc cứng
1. Màu, cỡ chữ, bo góc, bóng, khoảng cách lấy từ token (`@theme`) và tiện ích Tailwind. Cấm mã hex và `style={{}}` trừ giá trị động thật sự.
2. Dùng lại `components/ui`; thiếu thì tạo ở đó. Không thêm class mới vào `globals.css` ngoài base, token và kiểu chữ bài đọc.
3. Không gradient, bóng màu, kính mờ, đốm sáng trang trí. Không emoji làm icon (dùng `lucide-react`).
4. Không bịa số liệu, xếp hạng, lời chứng thực. Không đặt liên kết tới trang chưa tồn tại.
5. Nhãn cho người dùng, không lộ mã nội bộ (`GRADE_4`, `PUBLISHED`); dùng hàm ánh xạ trong `lib/format.ts`.
6. Dữ liệu từ API có đủ 3 trạng thái: đang tải (skeleton đúng hình), rỗng (có hành động), lỗi (có thử lại).
7. Ảnh: `alt` có nghĩa, khung tỉ lệ cố định, ảnh dự phòng khi lỗi, lazy trừ ảnh đầu trang.
8. Tiếng Việt hiển thị đúng dấu ở mọi cỡ chữ; không cắt (`truncate`) tiêu đề quan trọng khi có thể xuống dòng.
9. Truy cập: tương phản AA, vòng focus rõ, vùng chạm ≥ 44px, dùng được bằng bàn phím, đúng thẻ ngữ nghĩa, một `<h1>` mỗi trang.
10. Responsive: mobile trước; kiểm tra 360, 768, 1440; không cuộn ngang.
11. Mã: không `any`; không `setState` đồng bộ trong `useEffect`; dữ liệu qua hook TanStack Query trong `features/*`; trang công khai ưu tiên Server Component; không `dangerouslySetInnerHTML` ngoài sanitizer; nội dung có cấu trúc render bằng React element.
12. Frontend không tự quyết điểm, cấp độ, quyền hay vai trò; chỉ hiển thị kết quả từ server.

## Cách làm một trang hay component (việc lớn)
Làm thẳng, không dừng chờ duyệt kế hoạch (người dùng duyệt qua ảnh chụp). Chỉ dừng hỏi khi phải đổi dữ liệu hay API.
1. Đọc trang hiện tại, `components/ui`, trang mẫu. Xác định người dùng làm gì ở trang và thông tin nào quan trọng nhất.
2. Dùng lại component có sẵn; thiếu thì tạo theo `references/components.md`.
3. Viết bằng Tailwind và token, đủ 3 trạng thái dữ liệu, 1-2 chi tiết bản sắc nếu là trang nội dung.
4. Chạy `audit-ui.mjs`, rồi `pnpm --filter web lint`, `typecheck`, `test`, `build`.
5. Chụp 360, 768, 1440, tự nhìn ảnh theo checklist, sửa rồi mới báo.
6. Xóa class cũ trong `globals.css` thuộc phần đã chuyển (grep xác nhận). Nêu trang đã chuyển trong báo cáo.
Báo cáo: file đổi, ảnh chụp, kết quả lệnh, điều chưa làm.
