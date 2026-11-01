# History Learning Platform — SPEC

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
- Testing: Vitest, Supertest, Playwright
- Dev/CI: pnpm, Docker, GitHub Actions

## 3. Chức năng học sinh

- Đăng ký, đăng nhập, quản lý tài khoản
- Chọn và quản lý lớp học
- Xem và học bài học
- Hình ảnh, audio, video trong bài học
- Tìm kiếm và lọc bài học
- Làm quiz và xem kết quả
- Theo dõi tiến độ học tập
- Tính điểm, EXP và Level
- Thẻ lịch sử
- AI hỗ trợ hỏi đáp và giải thích kiến thức
- Ôn tập kiến thức

## 4. Chức năng Admin

- Quản lý người dùng
- Quản lý lớp học
- Quản lý chủ đề, thời kỳ, nhân vật, sự kiện
- Quản lý bài học và nội dung media
- Quản lý quiz và ngân hàng câu hỏi
- Quản lý nội dung AI tạo
- Theo dõi dữ liệu học tập

## 5. AI

- AI hỏi đáp về kiến thức Lịch sử
- AI giải thích và tóm tắt nội dung
- AI sử dụng Vector RAG để tìm kiếm nội dung bài học
- AI hỗ trợ tạo câu hỏi cho ngân hàng câu hỏi
- Nội dung AI tạo được kiểm soát trước khi sử dụng

## 6. Gamification

- EXP
- Level
- Thẻ lịch sử
- Nhiệm vụ
- Thành tích / phần thưởng học tập

## 7. Mailler
- Dịch vụ hỗ trợ

## 8. Quyền truy cập theo lớp

- Nội dung được phân loại theo lớp học.
- Học sinh được tiếp cận nội dung phù hợp với lớp của mình.
- Nội dung các lớp cao hơn có thể được mở khóa theo tiến độ học tập.

## 9. Mục tiêu nền tảng

- Hỗ trợ học Lịch sử theo chương trình lớp 4–12.
- Kết hợp học bài, luyện tập, ôn tập và AI.
- Nội dung Lịch sử được kiểm soát bởi Admin.
- Giao diện hỗ trợ cả máy tính và điện thoại.