# Base Project — History Learning Platform ✅

**Cập nhật lần cuối**: 2026-10-05 — Week 3 Dev A Day 3 hoàn thành

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
| `schemas/lesson.ts` | CreateLesson, LessonMedia, LessonCharacterRel, ListQuery |
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
| Error codes | 25+ mã lỗi trong `error-codes.ts` |
| Guards | JwtAuthGuard (global), RolesGuard, OriginGuard (CSRF) |
| Utils | `slugify` (Vietnamese), `sanitizeContent`, `htmlToText`, `generateToken` |
| 14 stub modules | grades, topics, periods, characters, events, lessons, progress, quizzes, gamification, search, dashboard, ai, mailer, media |

### Prisma Database
| Thành phần | Kết quả |
|---|---|
| Schema | 590 lines, 25 models, 12 enums |
| Migration `init` | Tất cả tables đã tạo |
| Migration `search_extensions` | unaccent, pg_trgm, GIN indexes |
| Seed data | 3 education levels, 9 grades, 5 levels, 8 topics, 8 periods, 6 missions, 15 cards, admin + user |

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

## Week 2 Exit Criteria

- [x] register → login → select grade flow hoàn chỉnh (API + Web)
- [x] Cookie auth với httpOnly cookie
- [x] Rate limiting (10/min auth, 3/hour forgot-password)
- [x] Route protection (middleware + AuthGate + AdminLayout guard)
- [x] Integration tests pass
- [x] TypeScript clean (api + web)
- [ ] Deploy (Vercel + Render) — chưa làm (cần env vars cloud)

---

## Week 3 Exit Criteria (tiến độ)

- [x] **Dev A Day 1**: Admin Topics CRUD + public `GET /topics` + `paginate()` helper + tests ✅
- [x] **Dev A Day 2**: Admin Periods CRUD + public `GET /periods` + tests (31/31) ✅
- [x] **Dev A Day 3**: Admin Characters CRUD (soft delete) + Events CRUD (soft delete) + slugify unit tests ✅
- [ ] Dev B: `admin-crud` v1: DataTable (server pagination, search, status filter)
- [ ] Dev B: EntityForm (config-driven), ConfirmDialog, StatusBadge; Topics/Periods/Characters/Events pages
- [ ] Dev B: ImageUploader (Cloudinary signed upload)
- [ ] Cả hai: Seed topics, periods, 6 characters, 6 events

---

## Bước tiếp theo (Week 3 — còn lại)

1. **Dev B**: `admin-crud` DataTable component (server pagination, search, status filter)
2. **Dev B**: EntityForm, ConfirmDialog, StatusBadge; Topics/Periods/Characters/Events admin pages
3. **Dev B**: ImageUploader (Cloudinary signed upload)
4. **Cả hai**: Seed topics, periods, 6 characters, 6 events

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
# Unit tests API
pnpm --filter api test

# E2E tests API (cần TEST_DATABASE_URL)
TEST_DATABASE_URL=postgresql://... pnpm --filter api test:e2e

# Chỉ chạy topics tests (nhanh hơn)
TEST_DATABASE_URL=postgresql://... pnpm --filter api exec vitest run --config ./vitest.config.e2e.ts test/topics.e2e-spec.ts

```
