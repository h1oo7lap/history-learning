# History Learning Platform — SPEC

> Trạng thái: [x] xong · [~] làm một phần · [ ] chưa làm · [-] ngoài phạm vi / cắt

## 1. Mục tiêu

Website hỗ trợ học tập môn Lịch sử cho học sinh lớp 4–12, kết hợp nội dung học tập, quiz, theo dõi tiến độ và AI.

## 2. Công nghệ

- Frontend: Next.js, React, TypeScript, Tailwind CSS, TanStack Query
- Backend: NestJS, TypeScript, Prisma
- Database: PostgreSQL + pgvector
- AI: Google Gemini, Embedding, Vector RAG
- Authentication: JWT, httpOnly Cookie, Argon2
- Validation: Zod
- Media: Cloudinary
- Testing: Vitest, Supertest (Playwright: chưa có test, cân nhắc bỏ khỏi danh sách)
- Dev/CI: pnpm, Docker, GitHub Actions

## 3. Chức năng học sinh

- [x] Đăng ký, đăng nhập, quản lý tài khoản
- [x] Chọn và quản lý lớp học
- [x] Xem và học bài học
- [x] Hình ảnh, audio, video trong bài học
- [~] Tìm kiếm và lọc bài học (lọc theo chủ đề, giai đoạn, độ khó; tìm theo tiêu đề, chưa tìm trong nội dung / không dấu)
- [x] Làm quiz và xem kết quả
- [x] Theo dõi tiến độ học tập
- [x] Tính điểm, EXP và Level
- [x] Thẻ lịch sử
- [x] AI hỗ trợ hỏi đáp và giải thích kiến thức
- [ ] Ôn tập kiến thức

## 4. Chức năng Admin

- [x] Quản lý người dùng
- [-] Quản lý lớp học (lớp cố định theo seed, không có trang quản lý)
- [x] Quản lý chủ đề, thời kỳ, nhân vật, sự kiện
- [x] Quản lý bài học và nội dung media
- [x] Quản lý quiz và ngân hàng câu hỏi
- [ ] Quản lý nội dung AI tạo
- [ ] Theo dõi dữ liệu học tập

## 5. AI

- [x] AI hỏi đáp về kiến thức Lịch sử
- [~] AI giải thích và tóm tắt nội dung (qua khung chat; chưa có nút riêng)
- [x] AI sử dụng Vector RAG để tìm kiếm nội dung bài học
- [ ] AI hỗ trợ tạo câu hỏi cho ngân hàng câu hỏi
- [ ] Nội dung AI tạo được kiểm soát trước khi sử dụng

## 6. Gamification

- [x] EXP
- [x] Level
- [x] Thẻ lịch sử
- [ ] Nhiệm vụ
- [~] Thành tích / phần thưởng học tập (đã có thưởng EXP, thăng cấp và mở khóa thẻ lịch sử khi học bài / làm quiz; chưa có danh hiệu / huy hiệu riêng)

## 7. Mailer

- [x] Gửi liên kết đặt lại mật khẩu
- [ ] Hỗ trợ người dùng (liên hệ Admin)
- [ ] Thông báo thay đổi thông tin tài khoản

## 8. Quyền truy cập theo lớp

- [x] Mỗi bài học thuộc một lớp; thứ tự lớp và cấp học (4–12) dùng để so sánh quyền truy cập
- [~] Học sinh đã chọn lớp xem, tìm kiếm và hỏi AI được bài của lớp mình và các lớp thấp hơn (đã áp dụng cho bài học, tìm kiếm bài học và AI; danh sách quiz hiện lọc theo lớp đang chọn, chưa áp cho dashboard)
- [x] Khách và người chưa chọn lớp chỉ thấy các bài tiêu biểu
- [x] Admin xem tất cả
- [x] Học sinh không tự đổi lớp sau lần chọn đầu; chỉ Admin đổi được
- [ ] Kênh liên hệ hỗ trợ đổi lớp qua Mailer

## 9. Mục tiêu nền tảng

- Hỗ trợ học Lịch sử theo chương trình lớp 4–12.
- Kết hợp học bài, luyện tập, ôn tập và AI.
- Nội dung Lịch sử được kiểm soát bởi Admin.
- Giao diện hỗ trợ cả máy tính và điện thoại.