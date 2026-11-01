# History Learning — hướng dẫn cho agent

Nền tảng học Lịch sử lớp 4–12 có AI. Monorepo pnpm:
- `apps/api`: NestJS, Prisma, PostgreSQL + pgvector (RAG).
- `apps/web`: Next.js, Tailwind, TanStack Query.
- `packages/shared`: schema Zod, enums, hằng số dùng chung hai phía.

## Đọc gì
Đọc theo nhu cầu, không đọc hết mỗi lần:
- `README.md`: cách cài đặt, chạy, lệnh, biến môi trường.
- `SPEC.md`: phạm vi và trạng thái (checklist `[x] [~] [ ] [-]`).
- Skill: `history-learning-dev` (luôn dùng), `-backend`, `-frontend`, `-features` khi liên quan.
- `apps/web/AGENTS.md`: bắt buộc đọc trước khi dùng API Next.js (phiên bản này khác kiến thức cũ).

Sự thật về hành vi nằm ở **code và test**. Nếu tài liệu khác code thì tin code và báo chênh lệch cho người dùng.

## Quy tắc cứng
- Không commit, push, tạo hay đổi nhánh khi chưa được yêu cầu.
- Không chạy: `git reset`, `git clean`, `git checkout -- .`, `prisma migrate reset|dev`, `db:reset`, `rm -rf`, `docker compose down -v`.
- DB dev chỉ do người dùng thao tác (`db:deploy`, `db:seed`, `ai:reindex`). Test chỉ chạy trên DB test.
- Test không gọi AI thật. Chỉ các script eval/smoke được chỉ định mới gọi, mỗi script một lần, ở cuối.
- Không commit `.env`, `.cache`, khóa API. Không đưa khóa vào hội thoại hay log.
- Windows/PowerShell: commit message dùng dấu nháy kép.

## Nguyên tắc chung
- Làm đúng phạm vi được giao; việc khác đáng sửa thì ghi một dòng cuối báo cáo.
- Không khẳng định "chạy được" khi chưa chạy; không chạy được thì nói rõ.
- Phiên bản thư viện lấy từ `package.json`, không theo trí nhớ.
