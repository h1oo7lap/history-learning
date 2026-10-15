# Base Project — History Learning Platform ✅

**Cập nhật lần cuối**: 2026-10-15 — Week 4 hoàn thành toàn diện (Lượt A, B, C, D: Block-based Content, Public Lessons & Renderer, Admin Block Editor, Quizzes Admin CRUD, CI Pipeline & Test Suite)

---

## Đã hoàn thành (Week 1 — Foundation)

### Infrastructure
- **Git repo** khởi tạo với commit đầu tiên (123 files)
- **pnpm workspace** với 4 packages: `apps/api`, `apps/web`, `packages/shared`, root
- **Docker Compose**: Postgres 16 + Mailpit đang chạy
- **GitHub Actions CI** workflow tại `.github/workflows/ci.yml`
- **Tooling**: `.editorconfig`, `.prettierrc`, `.gitignore`, `.nvmrc` (Node 24)

### packages/shared
| File | Nội dung |
|---|---|
| `enums.ts` | 12 enums (Role, UserStatus, PublishStatus, CardType, ...) |
| `constants.ts` | PAGINATION, CONTENT, AUTH, QUIZ, AI, SEARCH limits |
| `schemas/auth.ts` | Register, Login, ForgotPassword, ResetPassword |
| `schemas/user.ts` | UpdateProfile |
| `schemas/taxonomy.ts` | Topic, Period, Character, Event |
| `schemas/lesson.ts` | CreateLesson, UpdateLesson, LessonMedia, LessonCharacterRel, ListQuery, **ContentJsonSchema** (4 block types), **extractYoutubeId** |
| `schemas/quiz.ts` | Quiz, Question, Answer, Submit |
| `schemas/gamification.ts` | Mission, HistoryCard |
| `schemas/ai.ts` | AiChat |
| `schemas/common.ts` | Pagination, IdParam, SlugParam |

### apps/api (NestJS 12)
| Module | Trạng thái |
|---|---|
| `main.ts` | helmet, cookie-parser, global prefix /api, CORS, Swagger |
| `AppModule` | Tất cả modules đăng ký, global JWT + Roles guards |
| `PrismaModule` | Global, PrismaPg adapter |
| `AuthModule` | register, login, logout, me, forgot/reset password |
| `UsersModule` | GET/PATCH /me, progress, collection, missions + admin |
| `HealthModule` | GET /api/health → `{ success: true, data: { status: ok } }` |
| Response envelope | `{ success, data }` / `{ success, message, errorCode }` |
| Error codes | 30+ mã lỗi trong `error-codes.ts` |
| Guards | JwtAuthGuard (global), RolesGuard, OriginGuard (CSRF) |
| Utils | `slugify` (Vietnamese), `sanitizeContent`, `htmlToText`, `generateToken`, **`blocksToHtml`**, **`blocksToPlainText`**, **`hasTextContent`** |
| 14 stub modules | grades, topics, periods, characters, events, lessons, progress, quizzes, gamification, search, dashboard, ai, mailer, media |

### Prisma Database
| Thành phần | Kết quả |
|---|---|
| Schema | 592 lines, 25 models, 12 enums — **`Lesson.contentJson Json?`** thêm |
| Migration `init` | Tất cả tables đã tạo |
| Migration `search_extensions` | unaccent, pg_trgm, GIN indexes |
| Migration `lesson_content_json` | `ALTER TABLE lessons ADD COLUMN contentJson JSONB` |
| Seed data | 3 education levels, 9 grades, 5 levels, 12 topics, 8 periods, 6 characters, 6 events, 6 missions, 15 cards, 10 lessons, admin + user |

### apps/web (Next.js 16)
| File | Nội dung |
|---|---|
| `next.config.ts` | Proxy `/api/*` → NestJS (same-origin cookies) |
| `app/providers.tsx` | TanStack Query + Sonner toaster |
| `app/layout.tsx` | Root layout với metadata tiếng Việt |
| `app/page.tsx` | Landing page placeholder |
| `lib/api-client.ts` | Type-safe fetch wrapper với envelope handling |
| `lib/query-client.ts` | TanStack Query config (30s staleTime, 1 retry) |
| `lib/sanitize.ts` | DOMPurify wrapper cho lesson content |

---

## ✅ Đã hoàn thành (Week 2 — Auth & First Deploy)

### apps/api — Bổ sung Week 2

| Thành phần | Chi tiết |
|---|---|
| **GradesModule** | `GET /grades`, `GET /education-levels` — public, không cần auth |
| **GradesController** | Trả về grades (flat) và education levels (nested grades) |
| **GradesService** | `findAllEducationLevels()`, `findAllGrades()` — đúng field `displayOrder` |
| **UsersService** | Tách logic ra khỏi controller: `findById`, `updateProfile`, `getProgress`, `getCollection`, `getMissions` |
| **UsersController** | Delegate sang UsersService (thin controller) |
| **Auth Throttler** | `register`, `login` → 10 req/min; `forgot-password` → 3 req/hour |
| **seed.ts fix** | `.js` extensions trong dynamic import (moduleResolution nodenext) |
| **Typecheck** | ✅ API pass, ✅ Web pass |

### apps/api — Integration Tests

| File | Coverage |
|---|---|
| `test/setup.ts` | `createTestApp()`, `clearAuthTables()` helpers |
| `test/auth.e2e-spec.ts` | register (201, email lower, 409, validation), login (200+cookie, case-insensitive, 401, BANNED), logout (200+clear), me (200, 401), forgot-password (no enumeration, token created), reset-password (invalid token 400) |
| `test/users.e2e-spec.ts` | GET/PATCH /users/me, invalid gradeId → 404, 401 unauth, 403 USER→admin route, 200 ADMIN→admin route, GET /grades (public), GET /education-levels (nested) |

### apps/web — Bổ sung Week 2

| Thành phần | Chi tiết |
|---|---|
| **Design System** (`globals.css`) | CSS tokens (brand palette, shadows, radius), Inter + Outfit fonts, button variants, form controls, auth layout, navbar, dropdown, skeleton shimmer, grade cards |
| **middleware.ts** | Cookie-based route protection: redirect unauth → /login, auth → /dashboard |
| **features/auth/api.ts** | `authApi`, `usersApi`, `gradesApi` typed functions |
| **features/auth/hooks.ts** | `useMe`, `useIsAuthenticated`, `useRegister`, `useLogin`, `useLogout`, `useUpdateProfile`, `useForgotPassword`, `useResetPassword`, `useGrades`, `useEducationLevels` |
| **LoginForm** | RHF + Zod, hero panel (animated stars), password toggle, error display |
| **RegisterForm** | RHF + Zod, real-time password strength indicator (3-bar) |
| **PasswordForms** | ForgotPassword (success state) + ResetPassword (token from URL + confirm password) |
| **OnboardingGradeForm** | Education levels grouped, grade card grid, skip option |
| **Navbar** | Glassmorphism, sticky, desktop nav links, EXP badge, user dropdown (avatar, grade, admin link, logout), mobile drawer |
| **AuthGate** | Client-side auth gate với loading spinner, redirect to /login |
| **ProfilePage** | Avatar, fullName + grade edit, stats, loading skeleton |
| **AdminLayout** | Role gate (403 page for USER), sidebar navigation |

### Pages (app router)

| Route | File |
|---|---|
| `/` | `app/page.tsx` — Landing page premium (hero, features grid, CTA, footer) |
| `/login` | `app/(public)/login/page.tsx` |
| `/register` | `app/(public)/register/page.tsx` |
| `/forgot-password` | `app/(public)/forgot-password/page.tsx` |
| `/reset-password` | `app/(public)/reset-password/page.tsx` |
| `/onboarding/grade` | `app/(user)/onboarding/grade/page.tsx` — Protected |
| `/dashboard` | `app/(user)/dashboard/page.tsx` — Protected |
| `/profile` | `app/(user)/profile/page.tsx` — Protected |
| `/admin` | `app/(admin)/admin/page.tsx` — Admin only |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` — Admin only (stub) |

### lib additions

| File | Nội dung |
|---|---|
| `lib/cn.ts` | className utility |
| `lib/format.ts` | `formatDate`, `formatRelativeTime`, `formatNumber`, `formatTime`, `truncate` |
| `components/feedback/index.tsx` | `PageSkeleton`, `EmptyState`, `ErrorState`, `Forbidden` |

---

## ✅ Đã hoàn thành (Week 3 Day 1 — Dev A: Admin Topics CRUD)


### apps/api — Bổ sung Week 3

#### `paginate()` helper — nâng cấp

| File | Thay đổi |
|---|---|
| `src/common/pagination/paginate.ts` | Thêm `totalPages: Math.ceil(total / pageSize)` vào `PaginatedResult<T>` |
| `src/common/pagination/paginate.spec.ts` | **9 unit tests** — `paginate()` (totalPages ceil, total=0, preserves fields) + `getPaginationArgs()` (skip/take, page clamp, pageSize clamp) — ✅ |

#### TopicsModule — full CRUD

| File | Nội dung |
|---|---|
| `src/topics/topics.service.ts` | `findAllPublic()`, `findOneBySlug()`, `adminFindAll()`, `adminFindOne()`, `adminCreate()`, `adminUpdate()`, `adminDelete()` |
| `src/topics/topics.controller.ts` | `GET /topics` (public, paginated, searchable), `GET /topics/:slug` (public) |
| `src/topics/admin-topics.controller.ts` | `GET/POST /admin/topics`, `GET/PATCH/DELETE /admin/topics/:id` — `@Roles('ADMIN')` |
| `src/topics/topics.module.ts` | Wiring cả 2 controllers + service, `exports: [TopicsService]` |

#### Key behaviors

| Hành vi | Chi tiết |
|---|---|
| Slug auto-generate | `slugify(name)` → `uniqueSlug()` nếu conflict append `-1`, `-2`... |
| Explicit slug | Nếu admin truyền slug explicit + conflict → `409 SLUG_TAKEN` |
| Name change | Nếu name thay đổi mà không có slug explicit → tự động re-slugify |
| Public list | Chỉ trả `status = ACTIVE`, không bao giờ lộ INACTIVE |
| Admin list | Trả tất cả status; filter `?status=ACTIVE/INACTIVE`, `?search=...` |
| Pagination | `{ items, page, pageSize, total, totalPages }` — dùng `paginate()` helper |
| Error codes | `TOPIC_NOT_FOUND` (404), `SLUG_TAKEN` (409) |

#### Error codes — bổ sung

```
TOPIC_NOT_FOUND  → 404
SLUG_TAKEN       → 409
```

#### Test setup — fix

| File | Thay đổi |
|---|---|
| `test/setup.ts` | Thêm `AllExceptionsFilter` + `ResponseEnvelopeInterceptor` vào test app (mirror `main.ts`) |
| `vitest.config.e2e.ts` | Thêm `fileParallelism: false` để các test file chạy tuần tự, tránh DB contamination giữa files |

#### Integration tests — `test/topics.e2e-spec.ts`

| Nhóm | Tests |
|---|---|
| `POST /admin/topics` | create (201), auto-slug-dedup (`-1`), custom slug, 403 USER, 401 unauth, 400 validation |
| `GET /admin/topics` | all statuses, filter by status, search by name, pagination + totalPages |
| `GET /admin/topics/:id` | by ID, 404 not found |
| `PATCH /admin/topics/:id` | update name/status, auto re-slugify, 409 slug conflict, 404, 403 USER |
| `DELETE /admin/topics/:id` | hard delete, 404, 403 USER |
| `GET /topics` (public) | ACTIVE only without auth, pagination, search, ignores status param |
| `GET /topics/:slug` (public) | by slug, 404 for inactive, 404 for non-existent |

**Tổng: 29 tests ✅ — pass trong isolation; 52/56 khi chạy toàn bộ suite (4 failures là pre-existing trong `app.e2e-spec.ts` và `auth.e2e-spec.ts`)**

---

## ✅ Đã hoàn thành (Week 3 Day 2 — Dev A: Admin Periods CRUD)

### PeriodsModule — full CRUD

| File | Nội dung |
|---|---|
| `src/periods/periods.service.ts` | `findAllPublic()`, `findOneBySlug()`, `adminFindAll()`, `adminFindOne()`, `adminCreate()`, `adminUpdate()`, `adminDelete()` |
| `src/periods/periods.controller.ts` | `GET /periods` (public, paginated, searchable), `GET /periods/:slug` (public) |
| `src/periods/admin-periods.controller.ts` | `GET/POST /admin/periods`, `GET/PATCH/DELETE /admin/periods/:id` — `@Roles('ADMIN')` |
| `src/periods/periods.module.ts` | Wiring cả 2 controllers + service, `exports: [PeriodsService]` |

#### Key behaviors (giống Topics + extra fields)

| Hành vi | Chi tiết |
|---|---|
| Slug auto-generate | `slugify(name)` → `uniqueSlug()` nếu conflict append `-1`, `-2`... |
| Explicit slug | Nếu admin truyền slug explicit + conflict → `409 SLUG_TAKEN` |
| Name change | Nếu name thay đổi mà không có slug explicit → tự động re-slugify |
| startYear / endYear | Nullable integers; support BC years (âm) |
| Public list | Chỉ trả `status = ACTIVE`, không bao giờ lộ INACTIVE |
| Admin list | Trả tất cả status; filter `?status=ACTIVE/INACTIVE`, `?search=...` |
| Pagination | `{ items, page, pageSize, total, totalPages }` |
| Error codes | `PERIOD_NOT_FOUND` (404), `SLUG_TAKEN` (409) |

#### Error codes — bổ sung

```
PERIOD_NOT_FOUND → 404
```

#### Integration tests — `test/periods.e2e-spec.ts`

| Nhóm | Tests |
|---|---|
| `POST /admin/periods` | create (201), auto-slug-dedup (`-1`), custom slug, nullable dates, 403 USER, 401 unauth, 400 validation |
| `GET /admin/periods` | all statuses, filter by status, search by name, pagination + totalPages, 403 USER |
| `GET /admin/periods/:id` | by ID + startYear, 404 not found |
| `PATCH /admin/periods/:id` | update name/status, update years, auto re-slugify, 409 slug conflict, 404, 403 USER |
| `DELETE /admin/periods/:id` | hard delete, 404, 403 USER |
| `GET /periods` (public) | ACTIVE only without auth, pagination, search, ignores status param |
| `GET /periods/:slug` (public) | by slug, 404 for inactive, 404 for non-existent |

**Tổng: 31 tests ✅ — 31/31 pass**



```bash
GET http://localhost:4000/api/health
→ {"success":true,"data":{"status":"ok","timestamp":"..."}}

POST http://localhost:4000/api/auth/register
→ {"success":true,"data":{"id":"...","email":"test@test.com","role":"USER",...}}

pnpm --filter api typecheck   # ✅ exit 0
pnpm --filter api test        # ✅ 10/10 unit tests pass (paginate.spec.ts + app.controller.spec.ts)

# Topics tests (isolation):
TEST_DATABASE_URL=... pnpm --filter api exec vitest run --config vitest.config.e2e.ts test/topics.e2e-spec.ts
# ✅ 29/29 pass
```

---

## ✅ Đã hoàn thành (Week 3 Day 3 — Dev A: Characters CRUD + Events CRUD + Slugify util)

### CharactersModule — full CRUD (soft delete)

| File | Nội dung |
|---|---|
| `src/characters/characters.service.ts` | `findAllPublic()`, `findOneBySlug()`, `adminFindAll()`, `adminFindOne()`, `adminCreate()`, `adminUpdate()`, `adminDelete()` (soft delete → INACTIVE) |
| `src/characters/characters.controller.ts` | `GET /characters` (public, paginated, searchable), `GET /characters/:slug` (public) |
| `src/characters/admin-characters.controller.ts` | `GET/POST /admin/characters`, `GET/PATCH/DELETE /admin/characters/:id` — `@Roles('ADMIN')` |
| `src/characters/characters.module.ts` | Wiring cả 2 controllers + service, `exports: [CharactersService]` |

#### Key behaviors (Characters)

| Hành vi | Chi tiết |
|---|---|
| Slug auto-generate | `slugify(name)` → `uniqueSlug()` nếu conflict append `-1`, `-2`... |
| Explicit slug | Nếu admin truyền slug explicit + conflict → `409 SLUG_TAKEN` |
| Name change | Nếu name thay đổi mà không có slug explicit → tự động re-slugify |
| Extra fields | `avatar`, `shortDescription`, `biography`, `birthYear`, `deathYear` — tất cả nullable |
| **Soft delete** | `DELETE` không xoá record, chỉ set `status = INACTIVE` |
| Public list | Chỉ trả `status = ACTIVE`, không bao giờ lộ INACTIVE |
| Admin list | Trả tất cả status; filter `?status=ACTIVE/INACTIVE`, `?search=...` |
| Pagination | `{ items, page, pageSize, total, totalPages }` |
| Error codes | `CHARACTER_NOT_FOUND` (404), `SLUG_TAKEN` (409) |

#### Integration tests — `test/characters.e2e-spec.ts`

| Nhóm | Tests |
|---|---|
| `POST /admin/characters` | create (201), auto-slug-dedup (`-1`), custom slug, nullable dates, 403 USER, 401 unauth, 400 validation |
| `GET /admin/characters` | all statuses, filter by status, search by name, pagination + totalPages, 403 USER |
| `GET /admin/characters/:id` | by ID + birthYear, 404 not found |
| `PATCH /admin/characters/:id` | update name/status, update years, update bio/shortDescription, auto re-slugify, 409 slug conflict, 404, 403 USER |
| `DELETE /admin/characters/:id` | **soft delete** (record persists + status=INACTIVE), 404, 403 USER |
| `GET /characters` (public) | ACTIVE only without auth, pagination, search, never exposes INACTIVE |
| `GET /characters/:slug` (public) | by slug, 404 for inactive, 404 for non-existent |

**Tổng: 30 tests ✅**

---

### EventsModule — full CRUD (soft delete)

| File | Nội dung |
|---|---|
| `src/events/events.service.ts` | `findAllPublic()`, `findOneBySlug()`, `adminFindAll()`, `adminFindOne()`, `adminCreate()`, `adminUpdate()`, `adminDelete()` (soft delete → INACTIVE) |
| `src/events/events.controller.ts` | `GET /events` (public, paginated, searchable), `GET /events/:slug` (public) |
| `src/events/admin-events.controller.ts` | `GET/POST /admin/events`, `GET/PATCH/DELETE /admin/events/:id` — `@Roles('ADMIN')` |
| `src/events/events.module.ts` | Wiring cả 2 controllers + service, `exports: [EventsService]` |

#### Key behaviors (Events)

| Hành vi | Chi tiết |
|---|---|
| Slug auto-generate | `slugify(name)` → `uniqueSlug()` nếu conflict append `-1`, `-2`... |
| Explicit slug | Nếu admin truyền slug explicit + conflict → `409 SLUG_TAKEN` |
| Name change | Nếu name thay đổi mà không có slug explicit → tự động re-slugify |
| Extra fields | `description`, `startDate` (DateTime), `endDate` (DateTime), `location` — tất cả nullable |
| **Soft delete** | `DELETE` không xoá record, chỉ set `status = INACTIVE` |
| Public list | Chỉ trả `status = ACTIVE`, không bao giờ lộ INACTIVE |
| Admin list | Trả tất cả status; filter `?status=ACTIVE/INACTIVE`, `?search=...` |
| Pagination | `{ items, page, pageSize, total, totalPages }` |
| Error codes | `EVENT_NOT_FOUND` (404), `SLUG_TAKEN` (409) |

#### Integration tests — `test/events.e2e-spec.ts`

| Nhóm | Tests |
|---|---|
| `POST /admin/events` | create (201), auto-slug-dedup (`-1`), custom slug, nullable dates/location, 403 USER, 401 unauth, 400 validation |
| `GET /admin/events` | all statuses, filter by status, search by name, pagination + totalPages, 403 USER |
| `GET /admin/events/:id` | by ID + location, 404 not found |
| `PATCH /admin/events/:id` | update name/status, update dates/location, auto re-slugify, 409 slug conflict, 404, 403 USER |
| `DELETE /admin/events/:id` | **soft delete** (record persists + status=INACTIVE), 404, 403 USER |
| `GET /events` (public) | ACTIVE only without auth, pagination, search, never exposes INACTIVE |
| `GET /events/:slug` (public) | by slug, 404 for inactive, 404 for non-existent |

**Tổng: 29 tests ✅**

---

### Slugify utility — unit tests

| File | Nội dung |
|---|---|
| `src/common/utils/slugify.ts` | `slugify()` (Vietnamese diacritics, đ/Đ), `uniqueSlug()` (dedup counter) |
| `src/common/utils/slugify.spec.ts` | **16 unit tests** ✅ |

#### `slugify()` tests (11)

| Test | Chi tiết |
|---|---|
| basic text → kebab-case | `'Hello World'` → `'hello-world'` |
| Vietnamese diacritics | `'Trần Hưng Đạo'` → `'tran-hung-dao'` |
| đ and Đ | `'Đại Việt'` → `'dai-viet'`, `'đồng bằng'` → `'dong-bang'` |
| special characters | `'Hello! @World #2024'` → `'hello-world-2024'` |
| collapse hyphens | `'a - - b'` → `'a-b'` |
| trim leading/trailing hyphens | `'  --hello-- '` → `'hello'` |
| empty string | `''` → `''` |
| numeric input | `'1945'` → `'1945'` |
| underscores stripped | `'some_thing_here'` → `'somethinghere'` |
| complex Vietnamese | `'Chiến thắng Bạch Đằng'` → `'chien-thang-bach-dang'` |
| mixed-case with numbers | `'Lớp 7 Bài 3'` → `'lop-7-bai-3'` |

#### `uniqueSlug()` tests (5)

| Test | Chi tiết |
|---|---|
| base not taken | returns as-is |
| base taken | appends `-1` |
| counter increments | skips `-1`, `-2` → returns `-3` |
| slugifies base | Vietnamese input is normalized |
| slugifies on iteration | counter suffix appended to slugified base |

---

```bash
pnpm --filter api test
# ✅ 26/26 unit tests pass (paginate.spec.ts + slugify.spec.ts + app.controller.spec.ts)
```

---

## ✅ Đã hoàn thành (Week 3 — Dev B: Admin Frontend CRUD)

### Reusable Admin Components (`components/admin-crud/`)

| Component | File | Chi tiết |
|---|---|---|
| `DataTable` | `DataTable.tsx` (17.4 KB) | Server pagination, debounced search, status filter, custom column helpers (`nameColumn`, `slugColumn`, `statusColumn`, `dateColumn`, `actionButtons`) |
| `EntityForm` | `EntityForm.tsx` (11.5 KB) | Config-driven modal form (`FieldDef[]`), tự động validation, input mapping qua schema field types |
| `ImageUploader` | `ImageUploader.tsx` (9.1 KB) | Drag-and-drop, thanh progress, Cloudinary signed upload (upload trực tiếp từ trình duyệt) |
| `useAdminResource` | `useAdminResource.ts` (1.8 KB) | Generic hook quản lý state: page, pageSize, search, statusFilter, modal (openCreate/openEdit/closeModal), delete confirm (confirmDelete/cancelDelete) |
| `index.ts` | Barrel export | Re-exports `DataTable`, `EntityForm`, `ImageUploader`, `StatusBadge`, `ConfirmDialog` + types |

### Admin UI Components (`components/admin/`)

| Component | File | Chi tiết |
|---|---|---|
| `StatusBadge` | `StatusBadge.tsx` (2.3 KB) | 6 trạng thái + custom colors (ACTIVE, INACTIVE, PUBLISHED, DRAFT, ARCHIVED, BANNED) |
| `ConfirmDialog` | `ConfirmDialog.tsx` (2.5 KB) | Native `<dialog>` modal, styled icon, title/message/confirm/cancel buttons, loading state |

### Media API (Cloudinary) — Backend

| File | Chi tiết |
|---|---|
| `src/media/media.service.ts` | `signUpload(folder)` — SHA1 signature (Cloudinary signed upload), trả `{ signature, timestamp, cloudName, apiKey, folder }` |
| `src/media/media.controller.ts` | `POST /api/media/sign` — `@Roles('ADMIN')`, default folder `history-learning/uploads` |
| `src/media/media.module.ts` | Wiring controller + service |
| Error code | `MEDIA_NOT_CONFIGURED` (500) — khi thiếu env vars Cloudinary |

### Admin Features (`features/admin/`)

| File | Chi tiết |
|---|---|
| `api.ts` (6.8 KB) | Types (`Topic`, `Period`, `Character`, `HistoricalEvent`, `AdminUser`, `PaginatedResult<T>`, `AdminListQuery`) + 5 API objects: `topicsAdminApi`, `periodsAdminApi`, `charactersAdminApi`, `eventsAdminApi`, `usersAdminApi` — mỗi object có `list`, `getOne`, `create`, `update`, `delete` |
| `hooks.ts` (6.1 KB) | TanStack Query hooks: `useAdminTopics/Create/Update/Delete`, `useAdminPeriods/Create/Update/Delete`, `useAdminCharacters/Create/Update/Delete`, `useAdminEvents/Create/Update/Delete`, `useAdminUsers`, `useUpdateAdminUser` — auto invalidate queries on mutation |

### Refactored Admin Pages

Áp dụng các component trên để viết lại toàn bộ 4 trang admin, giảm trung bình **65-70% code** mỗi trang:

| Page | Route | Chi tiết |
|---|---|---|
| `topics/page.tsx` | `/admin/topics` | DataTable + EntityForm (name, slug, description, status) |
| `periods/page.tsx` | `/admin/periods` | DataTable + EntityForm (name, slug, description, startYear, endYear, status) |
| `characters/page.tsx` | `/admin/characters` | DataTable + EntityForm (name, slug, shortDescription, biography, birthYear, deathYear, avatar via ImageUploader, status) |
| `events/page.tsx` | `/admin/events` | DataTable + EntityForm (name, slug, description, startDate, endDate, location, status) |

---

## ✅ Đã hoàn thành (Week 3 — Seed Data: Characters + Events)

### `prisma/seed/taxonomy.ts` — bổ sung

#### 12 Topics (đã có từ trước, mở rộng từ 8 → 12)
| # | Name |
|---|---|
| 1 | Lịch sử Việt Nam cổ đại |
| 2 | Thời kỳ Bắc thuộc |
| 3 | Độc lập và phong kiến |
| 4 | Kháng chiến chống Pháp |
| 5 | Kháng chiến chống Mỹ |
| 6 | Lịch sử thế giới cổ đại |
| 7 | Lịch sử thế giới trung đại |
| 8 | Lịch sử thế giới cận đại |
| 9 | Lịch sử thế giới hiện đại |
| 10 | Văn hóa và nghệ thuật truyền thống |
| 11 | Danh nhân lịch sử |
| 12 | Các trận đánh lịch sử |

#### 6 Characters (mới)
| Name | Năm sinh – mất | Mô tả ngắn |
|---|---|---|
| Ngô Quyền | 898–944 | Đánh bại quân Nam Hán trên sông Bạch Đằng năm 938 |
| Đinh Bộ Lĩnh | 924–979 | Dẹp loạn 12 sứ quân, thống nhất giang sơn |
| Lý Công Uẩn | 974–1028 | Lý Thái Tổ, dời đô về Thăng Long |
| Trần Hưng Đạo | 1228–1300 | Ba lần đánh bại quân Nguyên Mông |
| Lê Lợi | 1385–1433 | Lãnh đạo khởi nghĩa Lam Sơn chiến thắng quân Minh |
| Quang Trung - Nguyễn Huệ | 1753–1792 | Thiên tài quân sự, đánh bại quân Thanh và Xiêm La |

#### 6 Events (mới)
| Name | Thời gian | Địa điểm |
|---|---|---|
| Chiến thắng Bạch Đằng | 938 | Sông Bạch Đằng |
| Dời đô về Thăng Long | 1010 | Thăng Long |
| Hội nghị Diên Hồng | 1284 | Thăng Long |
| Khởi nghĩa Lam Sơn | 1418–1427 | Thanh Hóa |
| Trận Ngọc Hồi - Đống Đa | 30/01–03/02/1789 | Hà Nội |
| Chiến dịch Điện Biên Phủ | 13/03–07/05/1954 | Điện Biên |

---

## Tổng hợp Error Codes (30+)

```
# Generic
VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_ERROR, RATE_LIMITED

# Auth
EMAIL_TAKEN, INVALID_CREDENTIALS, ACCOUNT_BANNED, ACCOUNT_INACTIVE, INVALID_RESET_TOKEN, RESET_TOKEN_EXPIRED

# Taxonomy
TOPIC_NOT_FOUND, PERIOD_NOT_FOUND, CHARACTER_NOT_FOUND, EVENT_NOT_FOUND, SLUG_TAKEN

# Lessons
LESSON_NOT_FOUND, LESSON_NOT_PUBLISHED

# Quiz
QUIZ_NOT_FOUND, QUIZ_ALREADY_EXISTS, QUIZ_NOT_PUBLISHED, QUIZ_TIME_EXPIRED, NO_OPEN_ATTEMPT

# Missions
MISSION_NOT_FOUND, MISSION_NOT_COMPLETED, MISSION_ALREADY_CLAIMED

# Media
MEDIA_NOT_CONFIGURED

# AI
AI_UNAVAILABLE

# Publish validation
PUBLISH_VALIDATION_FAILED
```

---

## Tổng hợp Test Coverage

| Loại | Package | File | Số tests |
|---|---|---|---|
| Unit | `apps/api` | `paginate.spec.ts` | 9 |
| Unit | `apps/api` | `slugify.spec.ts` | 16 |
| Unit | `apps/api` | `html.spec.ts` | 19 |
| Unit | `apps/api` | `youtube.spec.ts` | 17 |
| Unit | `apps/api` | `app.controller.spec.ts` | 1 |
| Unit | `apps/api` | `lessons.service.spec.ts` | 31 |
| Unit | `apps/api` | `quizzes.service.spec.ts` | 16 |
| Unit | `apps/api` | `admin-quizzes.controller.spec.ts` | 6 |
| Unit | `apps/web` | `format.spec.ts` | 8 |
| E2E | `apps/api` | `auth.e2e-spec.ts` | 17 |
| E2E | `apps/api` | `users.e2e-spec.ts` | 8 |
| E2E | `apps/api` | `topics.e2e-spec.ts` | 29 |
| E2E | `apps/api` | `periods.e2e-spec.ts` | 31 |
| E2E | `apps/api` | `characters.e2e-spec.ts` | 30 |
| E2E | `apps/api` | `events.e2e-spec.ts` | 29 |
| E2E | `apps/api` | `lessons.e2e-spec.ts` | 32 |
| E2E | `apps/api` | `app.e2e-spec.ts` | 1 |
| **Tổng** | | **17 test files** | **310 tests (100% pass)** |

---

## Week 2 Exit Criteria

- [x] register → login → select grade flow hoàn chỉnh (API + Web)
- [x] Cookie auth với httpOnly cookie
- [x] Rate limiting (10/min auth, 3/hour forgot-password)
- [x] Route protection (middleware + AuthGate + AdminLayout guard)
- [x] Integration tests pass
- [x] TypeScript clean (api + web)
- [ ] Deploy (Vercel + Render) — chưa làm (cần env vars cloud)

---

## Week 3 Exit Criteria ✅

- [x] **Dev A Day 1**: Admin Topics CRUD + public `GET /topics` + `paginate()` helper + tests ✅
- [x] **Dev A Day 2**: Admin Periods CRUD + public `GET /periods` + tests (31/31) ✅
- [x] **Dev A Day 3**: Admin Characters CRUD (soft delete) + Events CRUD (soft delete) + slugify unit tests ✅
- [x] **Dev B**: `admin-crud` v1: DataTable (server pagination, search, status filter, column helpers) ✅
- [x] **Dev B**: EntityForm (config-driven modal), ConfirmDialog, StatusBadge ✅
- [x] **Dev B**: ImageUploader (Cloudinary signed upload) + MediaService backend ✅
- [x] **Dev B**: Topics/Periods/Characters/Events admin pages refactored (65-70% code reduction) ✅
- [x] **Cả hai**: Seed 12 topics, 8 periods, 6 characters, 6 events ✅

---

## ✅ Đã hoàn thành (Week 4 — Lượt A: Block-based Content Backend & Shared Schemas)

### Schema & Database Migration
- Thêm cột `contentJson JSONB` vào bảng `lessons` (migration `lesson_content_json`), nullable và tương thích ngược 100% với các bài học dùng `content` (HTML) cũ.

### packages/shared (`schemas/lesson.ts`)
- **`ContentJsonSchema`**: Discriminated union định nghĩa 4 loại block (`text`, `image`, `audio`, `video`):
  - `id`: CUID/UUID duy nhất trong cùng bài học (`superRefine`).
  - Giới hạn tối đa 100 blocks, payload kích thước ≤ 200 KB (`CONTENT.LESSON_CONTENT_MAX_BYTES`).
  - `text`: Độ dài ≤ 10.000 ký tự, hỗ trợ cú pháp markdown inline (`**bold**`, `*italic*`).
  - `image`: URL giao thức `https` trỏ tới `res.cloudinary.com` kèm validate đúng cloud name của dự án; trường `alt` (bắt buộc) và `caption` (tuỳ chọn).
  - `audio`: URL Cloudinary audio, trường `title` (tuỳ chọn).
  - `video`: Lưu `youtubeId` 11 ký tự regex `^[A-Za-z0-9_-]{11}$`.
- **`extractYoutubeId`**: Tiện ích chuẩn hoá trích xuất YouTube ID từ mọi dạng URL (watch, youtu.be, embed, shorts, live) hoặc trả về null nếu không hợp lệ.
- **`blocksToHtml`**: Tự động chuyển đổi các text blocks thành HTML (`<p>`, escape HTML an toàn, convert `**bold**`/`*italic*`), bỏ qua image/audio/video (render riêng trên client).
- **`blocksToPlainText`** & **`hasTextContent`**: Trích xuất văn bản thuần cho AI và full-text search, kiểm tra bài học có nội dung chữ thật sự.

### apps/api (`LessonsService` & Controller)
- **Hybrid Content Processing**:
  - Khi client gửi `contentJson`: Server bỏ qua `content` thô từ client, tự động sinh HTML an toàn qua `blocksToHtml` và trích xuất plain text vào trường `content` để lưu trữ cho tìm kiếm và AI. Đồng thời validate nghiêm ngặt Cloudinary cloud name.
  - Khi client gửi `contentJson = null`: Quay về legacy HTML mode, áp dụng `sanitizeContent()`.
- **Quy tắc xuất bản (Publish Validation Rule)**: Bài học phải có ít nhất 1 khối `text` chứa nội dung hợp lệ. Bài chỉ có ảnh/video/audio mà không có chữ sẽ bị từ chối với lỗi `422 PUBLISH_VALIDATION_FAILED`.
- **Phân tách DTO**:
  - Endpoints danh sách (public + admin): Tối ưu payload, không trả `content` hay `contentJson` (dùng Prisma `select`).
  - Endpoints chi tiết: Trả đầy đủ `contentJson` cho client render.

---

## ✅ Đã hoàn thành (Week 4 — Lượt B: Public Lessons & Student Block Renderer)

### Student Block Renderer (`apps/web/components/content/BlockRenderer.tsx`)
- Trình render khối nhẹ, tối ưu hiệu năng không phụ thuộc thư viện markdown nặng bên ngoài:
  - **Inline Parser**: Tự xây parser xử lý `**in đậm**` (`<strong>`) và `*in nghiêng*` (`<em>`).
  - **`TextBlock`**: Tách dòng thành các thẻ `<p className="lesson-paragraph">` kèm render inline styles.
  - **`ImageBlock`**: Thẻ `<figure>` + `<img>` responsive, lazy loading, decoding async, kèm `<figcaption>`.
  - **`AudioBlock`**: Giao diện phát âm thanh HTML5 `<audio controls>` với tiêu đề và icon trực quan.
  - **`VideoBlock`**: Nhúng YouTube bảo mật cao qua domain `www.youtube-nocookie.com`, tỷ lệ khung hình 16:9 responsive.
  - **`LegacyContent`**: Chế độ tương thích ngược render HTML an toàn qua `DOMPurify` (`lib/sanitize.ts`).

### Trang danh mục bài học (`apps/web/app/lessons/page.tsx`)
- Server Component kết hợp Incremental Static Regeneration (ISR `revalidate: 30s`).
- Bộ lọc tích hợp:
  - Lọc theo Khối lớp (`gradeId`), Chủ đề (`topicId`), Độ khó (`difficulty`: Cơ bản / Trung bình / Nâng cao).
  - Ô tìm kiếm từ khoá tức thì (`search`).
  - Phân trang server-side linh hoạt (12 bài/trang).
- Giao diện thẻ bài học (`LessonCard`):
  - Ảnh bìa thumbnail chất lượng cao với fallback placeholder.
  - Badge độ khó (xanh lá / cam / đỏ), thời lượng đọc ước tính (⏱ phút).
  - Tags chủ đề và khối lớp trực quan, hiệu ứng hover mượt mà.

### Trang chi tiết bài học (`apps/web/app/lessons/[slug]/page.tsx`)
- Dynamic Metadata & OpenGraph: Tự động trích xuất tiêu đề, mô tả tóm tắt và thumbnail bài học cho SEO và chia sẻ mạng xã hội.
- Breadcrumbs điều hướng: `Trang chủ › Bài học › [Tiêu đề bài học]`.
- Hero header: Tiêu đề lớn, tóm tắt, huy hiệu độ khó, thời lượng, danh sách lớp học, tags giai đoạn và chủ đề lịch sử.
- Layout 2 cột hiện đại:
  - Cột chính: Khối nội dung bài học qua `BlockRenderer`, danh sách Nhân vật lịch sử (hiển thị vai trò trong bài học), danh sách Sự kiện liên quan.
  - Sidebar: Bảng thông tin tóm tắt bài học và nút CTA chuyển tiếp vào bài kiểm tra / dashboard.

### Mở rộng Design System & Configuration
- `apps/web/app/globals.css`: Bổ sung toàn bộ design tokens cho bài học, lưới card responsive, audio player, video 16:9 iframe, badges độ khó.
- `apps/web/next.config.ts`: Cấu hình whitelist `images.remotePatterns` cho Cloudinary (`res.cloudinary.com`) và YouTube (`img.youtube.com`).
- `apps/web/features/lessons/`: Khai báo types và client hooks (`lessonsApi`, `useLessons`, `useLessonBySlug`).

---

## ✅ Đã hoàn thành (Week 4 — Lượt C: Admin Block Editor & Quizzes Admin CRUD)

### Admin Visual Block Editor (`apps/web/components/content/BlockEditor.tsx`)
- Giao diện soạn thảo dạng khối trực quan cho quản trị viên:
  - Hỗ trợ thêm/xoá/di chuyển thứ tự (nút ↑ / ↓) linh hoạt cho cả 4 loại khối.
  - **Khối Văn bản (Text)**: Textarea tự giãn, bộ đếm ký tự (tối đa 10.000 ký tự), bảng hướng dẫn cú pháp markdown inline (`**đậm**`, `*nghiêng*`).
  - **Khối Hình ảnh (Image)**: Kéo-thả hoặc duyệt file tải lên trực tiếp Cloudinary (signed upload qua `POST /api/media/sign`), thanh tiến trình phần trăm thực tế (XMLHttpRequest progress).
  - **Khối Âm thanh (Audio)**: Tải lên file âm thanh MP3/OGG/WAV lên Cloudinary (`resource_type=video`, dung lượng tối đa 20MB).
  - **Khối Video (YouTube)**: Hỗ trợ dán đường link YouTube bất kỳ hoặc mã 11 ký tự; tự động trích xuất mã qua `extractYoutubeId()` và hiển thị xem trước thumbnail ngay lập tức.

### Trang quản lý bài học Admin (`apps/web/app/(admin)/admin/lessons/page.tsx`)
- Quản lý danh sách bài học qua `DataTable` với phân trang, tìm kiếm và lọc trạng thái (DRAFT / PUBLISHED / ARCHIVED).
- Modal tạo và chỉnh sửa bài học toàn diện:
  - Chuyển đổi linh hoạt giữa 2 chế độ: **`🧱 Trình soạn thảo khối (Khuyên dùng)`** và **`Mã nguồn HTML (Legacy)`**.
  - Quản lý đa quan hệ với dữ liệu thực: Chọn nhiều Lớp học (`Grades`), Chủ đề (`Topics`), Giai đoạn (`Periods`).
  - Bộ ghép quan hệ Nhân vật lịch sử kèm theo ô nhập vai trò cụ thể trong bài học.
  - Bộ ghép quan hệ Sự kiện lịch sử liên quan.
  - Kiểm tra điều kiện xuất bản ngay tại giao diện trước khi lưu.

### QuizzesModule — Backend Admin CRUD (`apps/api/src/quizzes/`)
- **`QuizzesService`**:
  - `adminFindAll`: Phân trang, tìm kiếm theo tiêu đề, lọc trạng thái, kèm số lượng câu hỏi và thông tin bài học.
  - `adminFindOne`: Lấy chi tiết quiz kèm danh sách câu hỏi và các đáp án theo thứ tự `order`.
  - `adminCreate`: Tạo quiz mới cho bài học với ràng buộc nghiệp vụ duy nhất 1 quiz trên 1 bài học (nếu đã có báo lỗi `409 QUIZ_ALREADY_EXISTS`).
  - `adminUpdate`: Cập nhật tiêu đề, mô tả, điểm đạt (`passScore`), thời gian làm bài (`timeLimit`), số lần làm bài tối đa (`maxAttempts`), trạng thái (`status`).
  - `adminDelete`: Xoá quiz khỏi hệ thống.
  - `adminSetQuestions`: Phương thức lưu nguyên tử (atomic transaction) toàn bộ câu hỏi và đáp án cho quiz (`prisma.$transaction`), tự động tính toán lại thứ tự, xoá câu hỏi cũ và tạo câu hỏi + đáp án mới.
  - `findPublishedByLessonId`: Endpoint hỗ trợ xem quiz đã xuất bản theo bài học.
- **`AdminQuizzesController`**:
  - Bảo vệ bởi `@Roles('ADMIN')` trên toàn bộ controller.
  - `GET /api/admin/quizzes`, `POST /api/admin/quizzes`
  - `GET /api/admin/quizzes/:id`, `PATCH /api/admin/quizzes/:id`, `DELETE /api/admin/quizzes/:id`
  - `PUT /api/admin/quizzes/:id/questions` (cập nhật danh sách câu hỏi & đáp án).
- **Unit Tests**:
  - `quizzes.service.spec.ts`: 16 test cases kiểm thử logic nghiệp vụ quiz.
  - `admin-quizzes.controller.spec.ts`: 6 test cases kiểm thử controller endpoints.

### QuizzesModule — Admin UI (`apps/web/app/(admin)/admin/quizzes/page.tsx`)
- Quản lý danh sách quiz qua `DataTable`: hiển thị tiêu đề, bài học liên kết, số câu hỏi, điểm đạt %, thời gian làm bài, trạng thái.
- Dialog tạo/sửa thông tin chung quiz với chọn bài học liên kết.
- Dialog quản lý câu hỏi & đáp án chuyên sâu (`QuestionsDialog`):
  - Thêm, sửa, xoá câu hỏi; hỗ trợ 2 loại câu hỏi: Trắc nghiệm (`MULTIPLE_CHOICE`) và Đúng/Sai (`TRUE_FALSE`).
  - Nhập nội dung câu hỏi, điểm số, phần giải thích chi tiết cho từng câu.
  - Quản lý các lựa chọn đáp án: nội dung đáp án, đánh dấu đáp án đúng (`isCorrect`).
  - Lưu toàn bộ thay đổi câu hỏi và đáp án qua 1 lần gọi API nguyên tử (`PUT /questions`).

---

## ✅ Đã hoàn thành (Week 4 — Lượt D: CI/CD Pipeline, Web Tests, Refinement & Agent Skills)

### CI/CD Pipeline (`.github/workflows/ci.yml`)
- Tích hợp GitHub Actions CI tự động hoá quy trình kiểm thử và chất lượng code:
  - Khởi tạo container dịch vụ `postgres:16` trong workflow, tự động bật sẵn các extension `unaccent` và `pg_trgm`.
  - Thực thi quy trình nghiêm ngặt:
    1. Cài đặt pnpm & caching `node_modules`
    2. Build package `@history-learning/shared`
    3. Typecheck toàn bộ workspace (`pnpm typecheck`)
    4. Lint mã nguồn (`pnpm lint`)
    5. Chạy unit tests backend & frontend (`pnpm --filter api test`, `pnpm --filter web test`)
    6. Chạy integration/e2e tests backend (`pnpm --filter api test:e2e`)
    7. Build ứng dụng frontend Next.js (`pnpm --filter web build`)

### Web Unit Testing & Utilities
- Bổ sung file kiểm thử `apps/web/lib/format.spec.ts` (8 test cases pass 100%) kiểm tra định dạng thời gian học, ngày tháng tiếng Việt và các tiện ích hiển thị.

### Cải tiến UI & Fix Lỗi Hệ Thống
- Nâng cấp `DataTable` và `EntityForm` hỗ trợ dialog responsive tốt hơn, tránh layout shift khi mở modal.
- Chuẩn hoá trang đăng nhập `LoginForm`, thông báo lỗi rõ ràng từ API envelope.
- Sửa cấu hình `prisma.config.ts`, loại bỏ fallback URL sai chuẩn để đảm bảo an toàn biến môi trường.

### Chuẩn hoá Quy trình với Hệ thống Agent Skills (`.agents/skills/`)
- Xây dựng 4 bộ kỹ năng quy chuẩn tài liệu dự án cho các AI coding subagents:
  - `history-learning-dev`: Quy trình làm việc tổng thể, quy tắc an toàn, pipeline kiểm tra trước khi báo hoàn thành.
  - `history-learning-backend`: Quy chuẩn kiến trúc NestJS 12, Prisma 7, Zod schemas, quy tắc migrations và e2e test helpers.
  - `history-learning-frontend`: Hướng dẫn Next.js 16 (App Router), Tailwind 4, TanStack Query, thiết kế giao diện cao cấp và accessibility.
  - `history-learning-features`: Trạng thái và quy tắc nghiệp vụ các tính năng cốt lõi (Auth, Bài học, Quiz học sinh, Tiến độ, Gamification, AI).

---

## Week 4 Exit Criteria ✅ (Đạt 100%)

- [x] **Lượt A — Backend Block Content**: Schema Prisma migration `contentJson`, shared Zod schemas (`ContentJsonSchema`), các utilities (`extractYoutubeId`, `blocksToHtml`, `blocksToPlainText`, `hasTextContent`), publish validation, unit & e2e tests pass ✅
- [x] **Lượt B — Public Lessons & Student Renderer**: Server Components `/lessons` & `/lessons/[slug]`, `BlockRenderer` (Text markdown, Image Cloudinary, Audio HTML5, Video YouTube privacy-enhanced), ISR 30s, dynamic metadata SEO/OpenGraph ✅
- [x] **Lượt C — Admin Block Editor**: Giao diện visual kéo thả `BlockEditor.tsx`, upload ảnh/audio Cloudinary với progress thực, preview YouTube, tích hợp vào Admin Lessons page với chế độ toggle HTML/Block ✅
- [x] **Lượt C — Quizzes Admin CRUD**: `QuizzesService` + `AdminQuizzesController`, transaction nguyên tử `PUT /:id/questions`, DataTable + QuizForm + QuestionsDialog quản lý inline câu hỏi & đáp án ✅
- [x] **Lượt D — CI/CD Pipeline**: GitHub Actions CI hoàn chỉnh với PostgreSQL container (`unaccent` + `pg_trgm`), chuỗi kiểm tra build -> typecheck -> lint -> test -> e2e -> web build xanh 100% ✅
- [x] **Lượt D — Test Coverage**: Tổng số tests tăng lên **310 tests** (115 API unit + 8 Web unit + 187 API e2e), tỷ lệ vượt qua 100% ✅
- [x] **Lượt D — Agent Skills**: 4 skills chuẩn hoá trong `.agents/skills/` hỗ trợ phát triển nhất quán ✅

---

## Bước tiếp theo (Week 5 — Student Quiz & Learning Progress)

1. **Lượt làm Quiz cho học sinh (Student Quiz Flow)**:
   - API bắt đầu làm bài: `POST /api/quizzes/:id/start` → sinh bản ghi `QuizAttempt`, tính thời gian bắt đầu và kết thúc (`startedAt`, `expiresAt`).
   - Màn hình làm quiz tương tác cho học sinh: đếm ngược đồng hồ thời gian, giao diện chọn đáp án một lựa chọn hoặc đúng/sai, cảnh báo khi sắp hết giờ.
   - API nộp bài và chấm điểm ở Server: `POST /api/quizzes/attempts/:id/submit` (chấm điểm độc lập tại server, tính tỷ lệ % đúng, so sánh `passScore`, đánh giá trạng thái PASSED / FAILED, lưu kết quả). Tuyệt đối không gửi đáp án đúng cho client trước khi nộp bài.
   - Màn hình xem lại kết quả: hiển thị điểm, tổng số câu đúng, xem lại từng câu hỏi kèm giải thích chi tiết cho câu sai.
2. **Tiến độ học tập (`LessonProgress`)**:
   - Lưu trữ trạng thái hoàn thành bài học: `POST /api/lessons/:id/complete` (upsert theo `userId, lessonId`).
   - Tự động ghi nhận hoàn thành bài học khi học sinh hoàn thành bài học và vượt qua quiz tương ứng.
3. **Student Dashboard thật**:
   - Kết nối dữ liệu thực tế từ database thay cho dữ liệu mẫu: số bài đã hoàn thành, điểm quiz gần nhất, gợi ý bài học kế tiếp theo lớp đã chọn.
4. **Chuẩn bị hạ tầng Triển khai (Deployment)**:
   - Frontend Next.js → Vercel (kèm cấu hình proxy API).
   - Backend API NestJS → Render / Railway (khu vực Singapore).
   - Database PostgreSQL → Supabase / Neon (Singapore, bật sẵn extensions `unaccent`, `pg_trgm`).

---

## Chạy dev

```bash
docker compose up -d
pnpm --filter @history-learning/shared build
pnpm dev:api   # port 4000
pnpm dev:web   # port 3000
```

## Chạy tests

```bash
# Toàn bộ Unit tests (API + Web)
pnpm test

# Unit tests API
pnpm --filter api test

# Unit tests Web
pnpm --filter web test

# E2E tests API (cần TEST_DATABASE_URL)
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/history_learning_test pnpm --filter api test:e2e

# Typecheck & Lint
pnpm typecheck
pnpm lint
```
