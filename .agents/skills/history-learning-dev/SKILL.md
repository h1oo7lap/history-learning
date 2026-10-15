---
name: history-learning-dev
description: Quy trình làm việc chung cho dự án History Learning (monorepo NestJS + Next.js). Dùng cho MỌI tác vụ code trong repo này, đặc biệt khi bắt đầu một việc mới, trước khi commit, hoặc khi báo cáo kết quả.
---
# Quy trình chung

## Cấu trúc repo
`apps/api` (NestJS 12 + Prisma 7), `apps/web` (Next.js 16), `packages/shared` (Zod, enum, hằng số). Schema Prisma gốc: `apps/api/prisma/schema.prisma`. Tài liệu: `SPEC.md`. Khi làm backend đọc skill history-learning-backend; khi làm giao diện đọc history-learning-frontend; khi làm tính năng còn thiếu đọc history-learning-features.

## Cách làm một việc
1. **Đọc trước**: file liên quan và một module tương tự đã có (mẫu: lessons, quizzes). Liệt kê file sẽ tạo/sửa.
2. **Với tính năng mới hoặc thay đổi schema/kiến trúc**: trình bày phương án ngắn (dữ liệu, API, màn hình, rủi ro) rồi DỪNG chờ duyệt. Việc nhỏ (sửa lỗi, đổi chữ, lint) thì làm luôn.
3. Làm đúng phạm vi được giao. Không sửa file ngoài phạm vi, không refactor tiện tay, không đổi phiên bản thư viện.
4. Test viết cùng hoặc trước code. Không xóa/bỏ qua test cũ cho pass.
5. Kiểm tra rồi mới báo xong.

## Quy tắc an toàn
- Không commit, không push, không tạo/đổi nhánh nếu người dùng chưa yêu cầu.
- Không commit `.env`, khóa API, mật khẩu thật. Giá trị mẫu chỉ ở `.env.example`.
- Không dùng lệnh phá hủy (`prisma migrate reset`, `db push --force-reset`, `rm -rf`, `git reset --hard`) khi chưa hỏi.
- Không thêm fallback che lỗi cấu hình (ví dụ URL DB mặc định trong `prisma.config.ts`); thiếu biến môi trường phải báo lỗi rõ.
- Không đặt file rác ở gốc repo (schema.prisma, init.sql, thư mục lạ).

## Kiểm tra trước khi báo xong
`pnpm --filter @history-learning/shared build` · `pnpm typecheck` · `pnpm lint` · `pnpm --filter api test` · `pnpm --filter api test:e2e` · `pnpm --filter web build`.
CI (GitHub Actions) chạy đúng các bước này; nếu CI đỏ, đọc log thật rồi sửa nguyên nhân, không tắt bước kiểm tra.

## Mẫu báo cáo
- Đã làm gì (1-3 dòng).
- File đã đổi.
- Lệnh đã chạy và kết quả (số test pass/fail).
- Phần chưa làm, rủi ro, việc cần người quyết định.
Không khẳng định "đã hoạt động" nếu chưa chạy thật.
