---
name: history-learning-frontend
description: Nguyên tắc xây dựng frontend History Learning bằng Next.js, React, Tailwind và TanStack Query; giữ giao diện nhất quán, dễ đọc và phù hợp học sinh.
---
# Frontend

Mục tiêu: giao diện học Lịch sử cho học sinh lớp 4–12, có cảm giác như một cuốn sách lịch sử hiện đại, dễ đọc và đáng tin.

## Việc nhỏ
Đổi màu/chữ/bố cục một chỗ, ẩn hoặc bỏ thành phần, sửa lỗi hiển thị: chỉ tuân thủ quy tắc bên dưới cho phần đang sửa (ví dụ đổi màu thì dùng token, không hex). Không đọc references, không chụp ảnh, không chạy audit hay build; chạy `lint` và `typecheck` rồi báo 2-3 dòng.

## Tài liệu tham khảo (đọc khi làm trang/component lớn, không đọc hết)
- `references/design-system.md` (token, font), `references/components.md` (đặc tả component), `references/page-patterns.md` (bố cục từng loại trang), `references/signature-elements.md` (bản sắc sách sử), `references/review-checklist.md` (tự kiểm tra trước khi báo xong).
- `scripts/audit-ui.mjs`: `node .agents/skills/history-learning-frontend/scripts/audit-ui.mjs <file hoặc thư mục>`.
- Trang mẫu: `/lessons` và `components/ui/*`.

## Trước khi sửa
- Đọc page/component/hook liên quan và xem pattern đang được dùng trong repo.
- Khi liên quan tới API Next.js, đọc `apps/web/AGENTS.md` và tài liệu phiên bản hiện có trong repo.
- Ưu tiên tái sử dụng component, hook và token đã có.

## Giao diện
- Giữ phong cách sách sử: nền ấm, chữ dễ đọc, serif cho nội dung đọc và sans cho UI.
- Dùng token/theme của project thay vì hard-code màu, kích thước hoặc style lặp lại.
- Tránh gradient, hiệu ứng nặng, giao diện kiểu SaaS hoặc card grid không cần thiết.
- Không dùng emoji thay icon khi project đã có icon library.

## Dữ liệu và tương tác
- Dữ liệu server đi qua cơ chế fetch/query hiện có; không tạo state hoặc API client song song nếu đã có abstraction.
- Xử lý đầy đủ trạng thái loading, empty và error phù hợp với ngữ cảnh.
- Frontend chỉ hiển thị kết quả từ server; không tự quyết định quyền, điểm, cấp độ hoặc vai trò.
- Không lộ enum/mã nội bộ cho người dùng nếu project đã có formatter.

## Accessibility và responsive
- Giữ focus rõ, tương phản tốt, thao tác bàn phím được và vùng chạm phù hợp.
- Thiết kế mobile-first; không để tràn ngang và kiểm tra các kích thước chính của project.
- Ảnh có alt phù hợp và fallback khi cần.

## Code
- Không dùng `any` nếu không thật sự cần.
- Không dùng `dangerouslySetInnerHTML` ngoài trường hợp đã được kiểm soát/sanitize.
- Ưu tiên Server Component cho phần công khai khi phù hợp; Client Component chỉ khi cần tương tác phía client.
- Không tạo abstraction mới nếu pattern hiện tại đã đáp ứng.

## Kiểm tra
- Chạy lint, typecheck, test hoặc build tùy phạm vi thay đổi.
- Với trang/layout lớn, kiểm tra responsive và giao diện thực tế trước khi báo xong.
- Không báo đã kiểm tra nếu chưa thực sự chạy.
