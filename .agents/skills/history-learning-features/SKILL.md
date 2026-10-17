---
name: history-learning-features
description: Quy tắc nghiệp vụ của History Learning (Auth, Bài học/contentJson, Quiz học sinh, Tiến độ, AI hỏi đáp, Deploy). Dùng khi xây hoặc sửa tính năng nghiệp vụ; mỗi quy tắc có mã để gắn với test.
---
# Quy tắc nghiệp vụ

Chỉ ghi "hệ thống phải hành xử thế nào". Trạng thái (đã có/chưa có) ở `PROGRESS.md`, phạm vi và lộ trình ở `SPEC.md`. Quy trình: history-learning-dev. Khi làm tính năng, kế hoạch và test phải dẫn mã quy tắc (L1, Q3...).

## Auth
- A1 Token trong cookie httpOnly; vai trò USER/ADMIN. A2 Route admin chỉ ADMIN. A3 Không lộ lý do cụ thể khi đăng nhập sai.

## Bài học
- L1 `contentJson` = `{version:1, blocks:[text|image|audio|video]}` là nguồn chính; `content` HTML do server sinh từ khối text.
- L2 Publish cần: title, có nội dung chữ, ≥1 lớp; nếu không thì 422 `PUBLISH_VALIDATION_FAILED`.
- L3 Ảnh/audio: https + Cloudinary của dự án. Video: chỉ lưu youtubeId.
- L4 "Xóa" bài học = ARCHIVED. L5 Người dùng thường chỉ thấy bài PUBLISHED.

## Quiz cho học sinh
- Q1 Chỉ quiz PUBLISHED của bài PUBLISHED mới làm được (`QUIZ_NOT_PUBLISHED`).
- Q2 Chấm điểm Ở SERVER. Trước khi nộp, dữ liệu gửi về không có `isCorrect` và `explanation`.
- Q3 Bắt đầu: nếu còn lượt chưa nộp và chưa hết hạn thì dùng lại lượt đó, không tạo thêm.
- Q4 Nộp bài bắt buộc có `attemptId`; lượt phải thuộc người nộp (khác người: 404 `ATTEMPT_NOT_FOUND`).
- Q5 Nộp bài idempotent: nộp lần hai trả kết quả đã lưu, không chấm lại, không ghi trùng. Việc "giành quyền nộp" phải nguyên tử (`updateMany where submittedAt null`) và nằm CÙNG transaction với việc ghi câu trả lời.
- Q6 Hết giờ: quá hạn + 10 giây du di thì `QUIZ_TIME_EXPIRED`. Mốc thời gian lấy theo server.
- Q7 SINGLE_CHOICE/TRUE_FALSE chọn đúng 1 đáp án. MULTIPLE_CHOICE đúng khi chọn đủ và không thừa (tất cả hoặc không).
- Q8 Câu bỏ trống tính sai. Đáp án/câu hỏi không thuộc quiz thì 400.
- Q9 `passed` = phần trăm ≥ `passScore`. Điểm và phần trăm tính ở server.
- Q10 Xem lại kết quả chỉ sau khi đã nộp (`ATTEMPT_NOT_SUBMITTED`); lúc này mới có đáp án đúng và giải thích.
- Q11 EXP/thẻ không thuộc phạm vi v1.
- Q12 Chỉ làm được quiz khi người dùng đã COMPLETED bài học gắn với quiz đó; chưa thì 403 `LESSON_NOT_COMPLETED`. ADMIN được bỏ qua để xem thử.
- Q13 `GET /api/quizzes` (đã đăng nhập) trả danh sách quiz kèm trạng thái mỗi quiz: LOCKED (chưa học xong bài), AVAILABLE, DONE (kèm điểm lần gần nhất). Mặc định lọc theo lớp của người dùng. Quiz LOCKED vẫn hiện, kèm bài cần học để mở khóa; không lộ câu hỏi.
- Q14 Cho phép làm lại nhiều lần; kết quả hiển thị là lần nộp gần nhất.

## Tiến độ học
- P1 `LessonProgress` duy nhất theo (userId, lessonId); ghi bằng upsert, lặp lại không đổi kết quả.
- P3 Bắt đầu: `POST /api/lessons/:id/start` tạo hoặc giữ IN_PROGRESS, không bao giờ hạ COMPLETED. Hoàn thành: `POST /api/lessons/:id/complete`, `completedAt` chỉ ghi lần đầu, gọi lặp lại trả cùng kết quả. Chỉ bài PUBLISHED. `GET` tiến độ của tôi theo bài hoặc danh sách.
- P2 Dashboard chỉ tổng hợp dữ liệu thật (bài đã học, điểm quiz gần nhất), không số liệu giả.

## AI hỏi đáp
- I1 Trả lời dựa trên nội dung bài PUBLISHED được truy xuất, và nêu nguồn (tên bài, slug).
- I2 Câu hỏi ngoài phạm vi lịch sử/ngoài tài liệu: từ chối lịch sự, không bịa.
- I3 Khóa API chỉ ở backend; có timeout, giới hạn tần suất theo người dùng; lỗi nhà cung cấp trả lỗi rõ; không lộ prompt hệ thống; không gửi thông tin cá nhân của học sinh.
- I4 Test bằng nhà cung cấp giả, không gọi API thật.
- Cách truy xuất cụ thể (tìm không dấu, chia đoạn, top-k) là chi tiết cài đặt, ghi trong kế hoạch được duyệt.

## Deploy
- D1 Web gọi API qua proxy cùng origin để cookie httpOnly hoạt động; kiểm tra Origin theo domain thật.
- D2 Migration bằng `prisma migrate deploy`. D3 Biến môi trường chỉ ở cấu hình nền tảng, không trong repo.
- D4 Chạy thử toàn luồng (đăng ký, chọn lớp, học, quiz, AI) trên môi trường thật trước khi coi là xong.
