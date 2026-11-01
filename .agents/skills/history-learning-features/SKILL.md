---
name: history-learning-features
description: Nguyên tắc nghiệp vụ bất biến của History Learning (nội dung bài học, quyền theo lớp, quiz, tiến độ, AI hỏi đáp, phần thưởng, bảo mật, triển khai). Dùng khi xây hoặc sửa tính năng nghiệp vụ.
---
# Nguyên tắc nghiệp vụ

Chỉ ghi điều luôn đúng. Chi tiết hành vi: đọc code và test, không đoán từ skill này. Phạm vi và trạng thái: `SPEC.md`.

## Nội dung và quyền
- Bài học thuộc một lớp. `Grade.displayOrder` là số lớp (4–12), dùng để so sánh quyền.
- Học sinh có lớp xem và hỏi AI được bài có số lớp nhỏ hơn hoặc bằng lớp mình. Khách và người chưa chọn lớp chỉ thấy bài `isFeatured`. Admin xem tất cả. Người thường chỉ thấy bài đã xuất bản. Dùng helper chung, không tự viết lại điều kiện.
- Học sinh không tự đổi lớp sau lần chọn đầu; Admin đổi được.
- Nội dung bài là dữ liệu có cấu trúc, validate ở server. Ảnh và audio: https, Cloudinary của dự án. Video: chỉ lưu id YouTube. "Xóa" bài học nghĩa là lưu trữ, không xóa cứng.
- Bài học thay đổi thì chỉ mục AI phải được dựng lại.

## Quiz và tiến độ
- Chấm điểm ở server. Không gửi đáp án hay giải thích trước khi nộp. Nộp bài idempotent. Lượt làm thuộc đúng người, thời hạn tính theo giờ server.
- Tiến độ học ghi bằng thao tác lặp lại an toàn; trạng thái hoàn thành không bị hạ.
- Số liệu thống kê chỉ từ dữ liệu thật.

## AI hỏi đáp
- Chỉ trả lời từ nội dung truy xuất của bài và nêu nguồn. Ngoài phạm vi thì từ chối cố định, không bịa.
- Khóa API chỉ ở backend; có timeout và giới hạn tần suất; quá tải hoặc hết hạn mức trả lỗi rõ (`AI_BUSY`); không lộ prompt hệ thống.
- Không gửi thông tin cá nhân của học sinh cho nhà cung cấp AI; log không chứa nội dung câu hỏi.
- Nội dung do AI tạo (câu hỏi, quiz) là bản nháp, Admin duyệt mới dùng.

## Phần thưởng
- EXP, thẻ, nhiệm vụ chỉ cấp qua một service riêng, idempotent. Frontend không tự quyết điểm, cấp độ, quyền.

## Bảo mật và triển khai
- Token trong cookie httpOnly; vai trò USER hoặc ADMIN; route admin chỉ ADMIN; đăng nhập sai không lộ lý do cụ thể.
- Bí mật chỉ ở backend và cấu hình nền tảng, không trong repo. Web gọi API qua proxy cùng origin.
- Migration áp bằng `prisma migrate deploy`. Chạy thử toàn luồng (đăng ký, chọn lớp, học, quiz, AI) trên môi trường thật trước khi coi là xong.
