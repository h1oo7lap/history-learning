# History Learning — hướng dẫn cho agent

History Learning là monorepo pnpm cho nền tảng học Lịch sử lớp 4–12 có AI:
- `apps/api`: NestJS, Prisma, PostgreSQL + pgvector.
- `apps/web`: Next.js, Tailwind, TanStack Query.
- `packages/shared`: schema Zod, enum và hằng số dùng chung.

## Đọc tài liệu
Đọc theo nhu cầu, không đọc toàn bộ repo mỗi lần:
- `README.md`: cài đặt, chạy và môi trường.
- `SPEC.md`: phạm vi/yêu cầu của project.
- `history-learning-dev`: quy trình chung, luôn áp dụng khi code.
- `history-learning-backend`, `-frontend`, `-features`: đọc khi công việc liên quan.
- Các `AGENTS.md` nằm sâu trong repo nếu có: tuân thủ khi làm trong phạm vi đó.

**Source code và test là nguồn sự thật về hành vi hiện tại.** Nếu tài liệu khác code, không tự hòa giải; báo rõ chênh lệch.

## An toàn (cụ thể, luôn áp dụng)
- Không commit, push, tạo hoặc đổi nhánh nếu chưa được yêu cầu.
- Không chạy: `git reset`, `git clean`, `git checkout -- .`, `prisma migrate reset|dev`, `db:reset`, `rm -rf`, `docker compose down -v`.
- DB dev chỉ do người dùng thao tác (`db:deploy`, `db:seed`, `ai:reindex`). Test chỉ chạy trên DB test.
- Không đưa secret, API key hoặc `.env` vào repo, log hay câu trả lời; không commit `.env`, `.cache`.
- Không gọi AI thật trong test; chỉ các script eval/smoke được chỉ định mới gọi, mỗi script một lần, ở cuối.
- Không tắt test, lint, typecheck hoặc CI chỉ để làm pass.
- Windows/PowerShell: commit message dùng dấu nháy kép.

## Nguyên tắc chung
- Làm đúng phạm vi được giao; không refactor hoặc sửa unrelated code tiện tay.
- Không suy đoán phiên bản thư viện, API hoặc implementation; kiểm tra repo trước.
- Không nói "đã chạy" hoặc "đã xong" nếu chưa thực sự kiểm tra.
- Khi có thay đổi lớn hoặc rủi ro, nêu kế hoạch và chờ quyết định khi cần.
