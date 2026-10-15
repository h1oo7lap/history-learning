---
name: history-learning-features
description: Trạng thái và quy tắc nghiệp vụ của các tính năng History Learning (Auth, Bài học/contentJson, Quiz học sinh, Tiến độ, Admin CMS, AI hỏi đáp, Deploy). Dùng khi xây hoặc sửa một tính năng nghiệp vụ, hoặc khi cần biết cái gì đã có, cái gì còn thiếu.
---
# Tính năng và quy tắc nghiệp vụ
Chi tiết yêu cầu nằm ở `SPEC.md`; file này chỉ ghi quy tắc dễ làm sai và trạng thái. Cập nhật mục "Trạng thái" khi hoàn thành. Quy trình thực hiện: skill history-learning-dev.

## Trạng thái (cập nhật khi đổi)
- Xong: Auth (cookie httpOnly), Admin CMS (users, lessons, topics, periods...), Lesson CRUD + editor khối, Quiz admin CRUD, Media upload (Cloudinary).
- Còn thiếu: Quiz học sinh, Tiến độ học, AI hỏi đáp, Dashboard thật, Deploy.
- Module stub (4 dòng): progress, ai, search, gamification, dashboard.

## Bài học (đã có, giữ nguyên quy tắc)
- `contentJson` = `{version:1, blocks:[text|image|audio|video]}`; `content` HTML do server sinh từ khối text (AI/search đọc `content`).
- Publish: có title, có nội dung chữ, ≥1 lớp, nếu không thì 422 `PUBLISH_VALIDATION_FAILED`.
- Ảnh/audio: https + Cloudinary của dự án. Video: chỉ lưu youtubeId, render youtube-nocookie.
- "Xóa" bài học = ARCHIVED.

## Quiz cho học sinh
- Bắt đầu lượt làm, nộp bài, xem kết quả. Chấm điểm Ở SERVER; không gửi đáp án đúng trước khi nộp.
- Chỉ quiz/bài PUBLISHED mới làm được. Kiểm tra thời gian ở server. Nộp bài idempotent.
- Kết quả lưu để tính tiến độ; EXP/thẻ thuộc v2, chưa làm.

## Tiến độ học
- `LessonProgress` duy nhất theo (userId, lessonId); hoàn thành bằng upsert.
- Dashboard chỉ tổng hợp dữ liệu thật (bài đã học, điểm quiz gần nhất).

## AI hỏi đáp (bắt buộc theo tên đề tài; cần cả skill history-learning-frontend cho khung chat)
- Truy xuất: bài PUBLISHED, tìm không dấu (unaccent + pg_trgm), cắt `content` theo heading, lấy top-k đoạn.
- Prompt = câu hỏi + đoạn trích; trả lời phải nêu nguồn (tên bài, slug); ngoài phạm vi thì từ chối lịch sự.
- Khóa API chỉ ở backend (`AI_API_KEY`); có timeout (`AI_TIMEOUT_MS`), giới hạn tần suất theo người dùng, xử lý lỗi nhà cung cấp, không lộ prompt hệ thống.
- Test bằng nhà cung cấp giả; không gọi API thật.
- Ghi lại bộ câu hỏi và kết quả đánh giá cho báo cáo.

## Deploy
- Biến môi trường: DATABASE_URL, JWT_SECRET, WEB_ORIGIN, COOKIE_*, CLOUDINARY_*, AI_*. Migration bằng `prisma migrate deploy`.
- Web gọi API qua proxy cùng origin để cookie httpOnly hoạt động; kiểm tra Origin/CSRF theo domain thật.
- Chạy thử toàn luồng (đăng ký, chọn lớp, học, quiz, AI) trên môi trường thật trước khi coi là xong.
