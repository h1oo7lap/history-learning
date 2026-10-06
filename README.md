# Học Lịch Sử — History Learning Platform

Nền tảng học lịch sử Việt Nam cho học sinh từ lớp 4 đến lớp 12.

> 📖 Đọc [`SPEC.md`](./SPEC.md) để hiểu yêu cầu và [`PLAYBOOK.md`](./PLAYBOOK.md) để biết cách triển khai.

---

## Cài đặt nhanh (Development)

### Yêu cầu

- Node.js 22 hoặc 24 LTS
- pnpm 10+
- Docker Desktop

### Khởi động

```bash
# 1. Cài đặt dependencies
pnpm install

# 2. Tạo file .env
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Khởi động Postgres + Mailpit
docker compose up -d

# 4. Build shared package
pnpm --filter @history-learning/shared build

# 5. Chạy migrations
pnpm db:migrate

# 6. Seed data
pnpm db:seed

# 7. Khởi động dev servers
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Swagger**: http://localhost:4000/api/docs
- **Mailpit**: http://localhost:8025

### Thao tác với Database

Khi cần xoá trắng và tạo lại database cùng với dữ liệu mẫu (seed data), bạn chạy lệnh sau ở thư mục gốc:

```bash
# Lệnh này sẽ xoá trắng DB, chạy lại toàn bộ migrations và tự động chạy file seed
pnpm db:reset
```

Nếu chỉ muốn chạy seed data (không reset):
```bash
pnpm db:seed
```

---

## Tài khoản mặc định (Seed)

| Tài khoản | Email | Mật khẩu |
|---|---|---|
| Admin | admin@example.com | Admin@12345 |
| User | user@example.com | User@12345 |

---

## Cấu trúc dự án

```text
history-learning/
├── apps/
│   ├── api/              # NestJS backend (port 4000)
│   └── web/              # Next.js frontend (port 3000)
├── packages/
│   └── shared/           # Zod schemas, enums, constants (used by both)
├── docker-compose.yml    # Postgres + Mailpit
├── SPEC.md               # Yêu cầu sản phẩm
└── PLAYBOOK.md           # Hướng dẫn triển khai
```

## Scripts

```bash
pnpm dev              # Chạy cả web và api song song
pnpm dev:api          # Chỉ chạy NestJS API
pnpm dev:web          # Chỉ chạy Next.js web
pnpm build            # Build tất cả
pnpm lint             # Lint tất cả
pnpm typecheck        # Kiểm tra TypeScript
pnpm test             # Chạy tests

pnpm db:migrate       # Chạy Prisma migrations
pnpm db:seed          # Seed dữ liệu mẫu
pnpm db:studio        # Mở Prisma Studio
pnpm db:reset         # Reset database
```

---

## Nguồn tài liệu lịch sử

- Sách giáo khoa Lịch sử các lớp 4–12 (Bộ GD&ĐT Việt Nam)
- Tất cả nội dung bài học đã được kiểm tra với sách giáo khoa trước khi được đánh dấu `PUBLISHED`

---

## Công nghệ

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16, TypeScript, TailwindCSS, shadcn/ui, TanStack Query |
| Backend | NestJS 12, TypeScript, Prisma 7, nestjs-zod |
| Database | PostgreSQL 16 |
| Auth | JWT (httpOnly cookie) + Argon2 |
| Media | Cloudinary |
| AI | LLM API (backend only) |
| Mail | Nodemailer + Mailpit (dev) |
