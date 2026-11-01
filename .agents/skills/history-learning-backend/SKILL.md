---
name: history-learning-backend
description: Quy ước backend và dữ liệu cho History Learning (NestJS, Prisma, Zod, PostgreSQL + pgvector). Dùng khi thêm hoặc sửa module API, schema Zod trong packages/shared, migration Prisma, truy vấn, hoặc test backend.
---
# Quy ước backend

## Kiến trúc
- Controller mỏng; logic ở service. Validate đầu vào bằng Zod, schema đặt trong `packages/shared/src/schemas` để web và api dùng chung.
- Lỗi nghiệp vụ dùng `AppError` với mã trong `common/errors/error-codes.ts`. Response đi qua envelope sẵn có, không tự bọc.
- Route công khai: `@Public()`. Route admin: `@Roles('ADMIN')` ở cấp controller; không để route admin thiếu `@Roles`.
- Danh sách dùng tiện ích phân trang sẵn có. Slug dùng tiện ích slugify; slug không tự đổi khi đổi tên.
- Quyền truy cập bài học theo lớp dùng helper chung (`common/utils/grade-access`), không viết lại điều kiện ở từng nơi.
- AI qua interface nhà cung cấp (chat, embedding) để thay được bằng bản giả khi test.

## Dữ liệu
- Không xóa cứng bản ghi có quan hệ Restrict; "xóa" nghĩa là đổi status (ARCHIVED, INACTIVE).
- Không tin client: sanitize HTML, kiểm tra URL (https, Cloudinary của dự án), nội dung có cấu trúc validate ở server.
- Quan hệ nhiều-nhiều: kiểm tra id tồn tại trước khi ghi; trả 400 thay vì để lỗi FK thành 500. Thay cả tập quan hệ trong một lần ghi.
- Thao tác có thể bị gọi lặp (nộp bài, tiến độ, thưởng) phải idempotent: upsert, hoặc "giành quyền" nguyên tử bằng `updateMany` có điều kiện; phần giành quyền và phần ghi phụ thuộc nằm CÙNG một transaction.
- SQL thô luôn dùng tham số, không nối chuỗi.
- Nội dung bài học đổi thì chỉ mục RAG phải được dựng lại (`ai:reindex`); ghi vào báo cáo để người dùng chạy.

## Schema và migration
- Không sửa `schema.prisma` khi chưa được duyệt.
- Migration: tạo bằng `--create-only`, đọc SQL (không DROP hay TRUNCATE dữ liệu) rồi mới áp dụng lên DB test. Người dùng tự chạy `db:deploy` trên DB dev.
- Migration viết tay (ví dụ extension, index đặc biệt): nếu Prisma báo drift thì DỪNG và hỏi, không reset DB.
- Migration chỉ sửa dữ liệu (UPDATE) thì ghi rõ trong tên và nội dung.

## Test
- E2E theo mẫu sẵn có trong `apps/api/test`; unit test cho logic thuần.
- Mỗi tính năng: trường hợp thành công, validation sai (400), chưa đăng nhập (401), không đủ quyền (403), không tìm thấy (404), xung đột (409) nếu có.
- Không TRUNCATE bảng dữ liệu seed dùng chung; tạo dữ liệu riêng bằng mã riêng.
- Test không gọi AI thật; dùng nhà cung cấp giả.
- Không xóa hay bỏ qua test cũ để qua.

## Lệnh kiểm tra
`pnpm --filter @history-learning/shared build`, `pnpm --filter api test`, `pnpm --filter api test:e2e` (cần DB test chạy). Quy trình chung: skill `history-learning-dev`.
