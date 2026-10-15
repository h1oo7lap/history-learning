---
name: history-learning-frontend
description: Hướng dẫn thiết kế và quy ước frontend cho dự án History Learning (Next.js 16, Tailwind 4, TanStack Query). Dùng khi tạo hoặc chỉnh trang, component, style, hoặc khi giao diện trông xấu/không nhất quán.
---
# Frontend: hướng thiết kế và quy ước

## Định hướng hình ảnh (tránh giao diện "template AI")
- Phong cách "trang sách sử": nền giấy ấm (#FAF6EE), chữ mực (#1F1B16), điểm nhấn đỏ son (#9B2C2C) và vàng đồng (#B7791F) dùng tiết chế. Không dùng gradient tím-xanh, không hero căn giữa kèm lưới thẻ 3x2 chung chung.
- Chữ: dùng `next/font` với font hỗ trợ tiếng Việt. Tiêu đề và nội dung bài đọc dùng serif (Source Serif 4 hoặc Noto Serif), giao diện (nút, nhãn, bảng) dùng sans (Be Vietnam Pro hoặc Inter).
- Định nghĩa token (màu, bo góc, bóng, khoảng cách) MỘT chỗ bằng `@theme` của Tailwind 4. Không rải mã màu hex trong component.
- Hình minh họa mang tính lịch sử (bản đồ, tranh, dòng thời gian) quan trọng hơn trang trí. Mỗi trang có một ý tưởng thị giác rõ ràng.

## Quy tắc cứng
- Không dùng emoji làm icon. Dùng `lucide-react`.
- Không bịa số liệu hay khẩu hiệu ("1.200+ học sinh", "số 1 Việt Nam"). Chỉ hiển thị dữ liệu thật hoặc bỏ phần đó.
- Hiển thị nhãn cho người dùng, không hiển thị mã nội bộ (hiện "Lớp 4", không hiện `GRADE_4`; hiện "Trung bình", không hiện enum).
- Mọi ảnh có `alt`, có ảnh dự phòng khi lỗi tải (`onError`/placeholder), có tỉ lệ cố định để không giật bố cục.
- Mọi danh sách/trang dữ liệu có đủ 3 trạng thái: đang tải (skeleton), rỗng (có hướng dẫn hành động), lỗi (có nút thử lại).
- Chữ bài đọc: độ rộng tối đa ~68 ký tự, line-height ~1.75, khoảng cách đoạn ~1em, thang tiêu đề rõ ràng (h2 lớn hơn thân bài rõ rệt). Không để khoảng trắng dọc quá lớn giữa các đoạn.
- Khả năng truy cập: tương phản đạt AA, vòng focus nhìn thấy được, vùng chạm ≥ 44px, điều hướng bằng bàn phím.
- Responsive: kiểm tra 360px, 768px, 1440px. Không có cuộn ngang.
- Tái sử dụng component chung (`components/ui`: Button, Card, Badge, Input, Select, Skeleton, EmptyState). Hạn chế thêm class tay vào `globals.css`; ưu tiên tiện ích Tailwind và token.

## Mã
- Không dùng `any`. Không gọi `setState` đồng bộ trong `useEffect` (dùng `key` để reset form, khởi tạo state từ props, hoặc tính giá trị dẫn xuất).
- Dữ liệu từ API qua hook TanStack Query trong `features/*`. Trang công khai ưu tiên Server Component.
- Không dùng `dangerouslySetInnerHTML` trừ khi qua sanitizer; nội dung `contentJson` render bằng React element.

## Kiểm tra trước khi báo xong
Chạy `pnpm --filter web lint`, `typecheck`, `build`; chụp màn hình bằng Playwright ở 360/768/1440 px và xem lại bằng mắt. Mô tả điều gì đã được cải thiện so với trước.
