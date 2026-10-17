---
name: history-learning-backend
description: Quy ước backend, dữ liệu và test cho History Learning (NestJS, Prisma, Zod, Postgres; phiên bản theo package.json). Dùng khi thêm/sửa module API, schema Zod trong packages/shared, migration Prisma hoặc test e2e.
---
# Quy ước backend (đọc trước khi sửa apps/api hoặc packages/shared)

## Kiến trúc
- Controller mỏng. Validate bằng `ZodValidationPipe(Schema)` với schema đặt trong `packages/shared/src/schemas`. Logic nằm trong service.
- Lỗi nghiệp vụ: `throw new AppError(ErrorCodes.X, status, message)`. Thêm mã mới vào `common/errors/error-codes.ts`.
- Response luôn qua envelope `{success, data}` / `{success:false, message, errorCode}` (đã có interceptor + filter), không tự bọc lại.
- Route công khai: `@Public()`. Route admin: `@Roles('ADMIN')` ở cấp controller. KHÔNG để route admin thiếu `@Roles`.
- Danh sách: dùng `getPaginationArgs` + `paginate` (page, pageSize). Slug: `slugify`/`uniqueSlug`; slug không tự đổi khi đổi tên.

## Dữ liệu
- Không xóa cứng bản ghi có FK Restrict (lesson, topic, period...). "Xóa" = đổi status (ARCHIVED/INACTIVE).
- Quan hệ nhiều-nhiều: kiểm tra id tồn tại trước khi ghi (trả 400 VALIDATION_ERROR, không để lỗi FK thành 500). Thay thế toàn bộ tập quan hệ trong một lần ghi.
- Không tin client: sanitize HTML (`sanitizeContent`), kiểm tra URL (https, Cloudinary của dự án), video chỉ lưu youtubeId.
- Nội dung có cấu trúc phải theo schema chuẩn và được validate ở server. Quy tắc cụ thể: skill history-learning-features.
- Không sửa `apps/api/prisma/schema.prisma` khi chưa được duyệt. Migration: `prisma migrate dev --create-only`, đọc SQL, rồi mới áp dụng. Migration `search_extensions` là thủ công: nếu Prisma báo drift thì DỪNG và hỏi, không reset DB.
- Thao tác ghi có thể bị gọi lặp (nộp bài, tiến độ) phải idempotent: upsert/createMany skipDuplicates, hoặc "giành quyền" nguyên tử bằng `updateMany` có điều kiện. Phần giành quyền và phần ghi dữ liệu phụ thuộc phải CÙNG một `$transaction`. Không bắt lỗi unique bên trong transaction Postgres.

## Test
- E2E theo mẫu `test/topics.e2e-spec.ts` (`createTestApp`, `clearAuthTables`, cookie admin/user).
- Không TRUNCATE bảng `grades`/`education_levels` (test khác dùng dữ liệu seed); tạo dữ liệu riêng bằng upsert với mã riêng.
- Test nghiệp vụ gắn mã quy tắc trong tên test (ví dụ `Q5: ...`).
- Mỗi tính năng cần: trường hợp thành công, validation sai (400), 401 khi chưa đăng nhập, 403 khi không phải admin, 404, xung đột (409) nếu có.
- Không xóa hay bỏ qua test cũ để cho pass.

## Lệnh kiểm tra backend
`pnpm --filter @history-learning/shared build`, `pnpm --filter api test`, `pnpm --filter api test:e2e` (cần TEST_DATABASE_URL và CLOUDINARY_CLOUD_NAME). Quy trình chung xem skill history-learning-dev.
