---
name: history-learning-backend
description: Nguyên tắc backend cho History Learning. Dùng khi thêm hoặc sửa API, nghiệp vụ, dữ liệu, schema dùng chung hoặc test backend.
---
# Backend

## Kiến trúc
- Controller nhận request và điều phối; business logic nằm ở service/domain phù hợp.
- Request validation dùng schema chung và cơ chế validation hiện có của repo.
- Dùng cơ chế lỗi và response envelope chung của project; không tạo cách xử lý song song.
- Phân quyền và route public/admin phải dùng cơ chế auth hiện có; route admin không được thiếu guard vai trò (`@Roles('ADMIN')`).
- Tái sử dụng helper/service cho business rule dùng chung, không copy điều kiện giữa module.
- Không tin dữ liệu quyền, user, grade hoặc trạng thái do client tự quyết định.

## Dữ liệu
- Tôn trọng quan hệ và lifecycle của model; không hard delete khi domain yêu cầu lưu trạng thái.
- Kiểm tra dữ liệu liên quan trước khi ghi; không biến lỗi ràng buộc database thành lỗi 500 không chủ đích.
- Sanitize và validate dữ liệu ở server theo rule hiện có của project.
- Thao tác có thể lặp phải có cơ chế idempotent hoặc chống ghi trùng phù hợp.
- Các ghi dữ liệu phụ thuộc nhau phải có tính nguyên tử khi business rule yêu cầu.
- SQL thô phải an toàn và có tham số.

## Schema và migration
- Không sửa Prisma schema khi chưa được duyệt; trước khi đổi, kiểm tra ảnh hưởng tới API, frontend, seed và test.
- Migration: tạo bằng `--create-only`, đọc SQL (không DROP/TRUNCATE dữ liệu) rồi mới áp dụng lên DB test. Người dùng tự chạy `db:deploy` trên DB dev.
- Không reset hoặc phá dữ liệu để xử lý lỗi schema/drift.
- Các extension/index đặc biệt phải tuân theo cách project hiện đang quản lý.

## AI và dữ liệu đặc thù
- AI backend đi qua abstraction/provider hiện có để có thể thay bằng fake provider khi test.
- Không đưa secret hoặc dữ liệu nhạy cảm vào source, log hoặc request không cần thiết.
- Khi thay đổi dữ liệu được AI/RAG sử dụng, kiểm tra cơ chế indexing hiện có và nhắc người dùng chạy `ai:reindex`.

## Test
- Bảo vệ các business rule quan trọng bằng test.
- Kiểm tra happy path và các lỗi/quyền/trạng thái quan trọng của endpoint.
- Test không gọi nhà cung cấp AI thật trừ các script được thiết kế riêng cho việc đó.
- Không xóa hoặc bỏ qua test cũ chỉ để làm suite pass; không TRUNCATE bảng dữ liệu seed dùng chung.

## Kiểm tra
Dùng các script hiện có trong repo, tối thiểu tùy phạm vi:
- shared build
- API unit test
- API e2e
- các kiểm tra CI liên quan

Không tự đặt lại lệnh hoặc phiên bản nếu repo đã có script tương ứng.
