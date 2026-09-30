# PLAYBOOK — History Learning Platform

Companion to `SPEC.md` (v2). SPEC says **what** to build. This file says **how, with which numbers, in which order**.
If they conflict, fix SPEC first (Rule 3), then follow it.

Kit contents:

```text
SPEC.md                                   requirements (v2)
PLAYBOOK.md                               this file
docker-compose.yml, docker/postgres/init.sql
apps/api/prisma/schema.prisma             full schema, ready to migrate
apps/api/.env.example, apps/web/.env.example
```

---

# 1. Technology and versions

## 1.1 Version policy

* Pin exact versions through `pnpm-lock.yaml`. Commit it. Upgrade only between weeks, never mid-feature.
* Use the **latest stable major** available on the day of kickoff, except where the table says otherwise.

| Tool | Version | Note |
|---|---|---|
| Node.js | 22 LTS or 24 LTS | Same version on both machines and CI. Add `.nvmrc` and `engines` in `package.json` |
| pnpm | 10.x | `corepack enable`; set `packageManager` in root `package.json` |
| TypeScript | 5.x, `strict: true` | Also `noUncheckedIndexedAccess: true` |
| PostgreSQL | 16 | Match cloud DB major version |
| NestJS | 11.x or newer | |
| Next.js | latest stable, App Router | |
| React | version required by Next.js | |
| TailwindCSS + shadcn/ui | latest stable | Use `shadcn` CLI to add components |
| **Prisma** | **7.x — install explicitly** | See warning below |
| Zod | the major supported by `nestjs-zod` | Verify in the week 1 spike |
| TanStack Query | v5 | |
| Playwright, Vitest, Jest | latest stable | |

> **Prisma warning (verified at kickoff):** the npm `latest` tag of `prisma` can point to a Prisma 8 pre-release that does not have `migrate`/`generate` the way this project needs. Always install with an explicit major:
> `pnpm add -D prisma@7` and `pnpm add @prisma/client@7 @prisma/adapter-pg`. Keep `prisma` and `@prisma/client` on the same major. Never run `pnpm update --latest` on Prisma.

## 1.2 Libraries

**Backend (`apps/api`)**

```text
@nestjs/config  @nestjs/passport  passport  passport-jwt  @nestjs/jwt
@nestjs/throttler  @nestjs/swagger  helmet  cookie-parser
nestjs-zod  zod  argon2  sanitize-html  nodemailer
nestjs-pino  pino-http  pino-pretty(dev)
@prisma/client@7  @prisma/adapter-pg  pg
cloudinary  (or @supabase/supabase-js)
dev: prisma@7  tsx  dotenv  jest  ts-jest  supertest  @types/*
```

**Frontend (`apps/web`)**

```text
@tanstack/react-query  @tanstack/react-table
react-hook-form  @hookform/resolvers  zod
@tiptap/react  @tiptap/starter-kit  @tiptap/extension-image  @tiptap/extension-link
dompurify  (+ types)  lucide-react  sonner (toast)
dev: vitest  @testing-library/react  @playwright/test
```

**Shared (`packages/shared`)**: only `zod`. No framework imports.

## 1.3 Week 1 spikes (half a day each, do before writing features)

1. `nestjs-zod` + Zod version compatibility, validation pipe returns our error format.
2. Prisma 7 + NestJS CommonJS: generate client with `moduleFormat = "cjs"`, `PrismaPg` adapter, run one query.
3. `packages/shared` imported by both `web` and `api` (build or TS path setup that works in both).
4. Next.js rewrite `/api/*` → NestJS, `Set-Cookie` passes through.
5. Tiptap renders and saves HTML; DOMPurify + sanitize-html round trip.

If a spike fails, decide the fallback the same day and record it in SPEC.

---

# 2. Parameters (single source of truth)

Put backend values in `apps/api/src/common/config/constants.ts`. Never scatter magic numbers.

## 2.1 Servers and infra

| Parameter | Value |
|---|---|
| Web dev port | 3000 |
| API dev port | 4000 (global prefix `/api`) |
| Postgres | 5432, db `history_learning`, test db `history_learning_test` |
| Mailpit | SMTP 1025, UI 8025 |
| DB pool (`pg`) | max 10 in dev, 5 on free cloud tiers |
| Timezone | store UTC; display `Asia/Ho_Chi_Minh` |
| Body size limit | JSON 1 MB; admin lesson save 2 MB |
| Request timeout (API) | 30 s (AI calls 30 s, everything else should be < 2 s) |
| Region | Singapore for API and DB |

## 2.2 Auth

| Parameter | Value |
|---|---|
| Password | min 8, max 128 chars, at least one letter and one digit |
| Hash | Argon2id, `memoryCost 19456` (19 MiB), `timeCost 2`, `parallelism 1` |
| JWT | HS256, expires `7d`, payload `{ sub: userId }` only (role is read from DB) |
| Cookie | name `access_token`; `httpOnly`, `secure` in prod, `sameSite: 'lax'`, `path: '/'`, `maxAge` 7 days |
| Reset token | 32 random bytes (hex), store SHA-256 hash, expires 30 min, single use |
| Email | lowercase + trim before save/compare |
| fullName | 2–100 chars |

## 2.3 Rate limits (in-memory throttler)

| Scope | Limit |
|---|---|
| Global | 100 req / min / IP |
| `POST /auth/login`, `/auth/register` | 10 / min / IP |
| `POST /auth/forgot-password` | 3 / hour / IP and 3 / hour / email |
| `POST /ai/chat` | 10 / min and 50 / day / user (day resets 00:00 ICT) |
| Admin upload sign | 30 / min / user |

## 2.4 Content

| Parameter | Value |
|---|---|
| Slug | lowercase kebab-case from unaccented title; on conflict append `-2`, `-3`... Slug never changes after PUBLISHED |
| Lesson title | 5–200 chars |
| Lesson summary | ≤ 500 chars |
| Lesson content | ≤ 200 KB sanitized HTML |
| `estimatedTime` | 1–180 minutes |
| Image upload | ≤ 5 MB; jpg, png, webp; serve through Cloudinary transformation (width ≤ 1280) |
| Media per lesson | ≤ 20 |
| Pagination | `pageSize` default 20, max 100 |
| Search | min 2 chars; max 5 results per group; debounce 300 ms in UI |

## 2.5 Quiz

| Parameter | Value |
|---|---|
| `passScore` | default 60 (%), range 0–100 |
| Question `points` | default 1 |
| Answers per question | 2–6 (TRUE_FALSE exactly 2) |
| Questions per quiz | 1–50 |
| Time limit grace | 10 s |
| Open attempts | 1 per user per quiz; starting again returns the same open attempt |
| Stale open attempts | attempts open > 24 h can be replaced by a new one |

## 2.6 Gamification

| Parameter | Value |
|---|---|
| `LESSON_COMPLETION` | 20 EXP, once per lesson |
| `QUIZ_COMPLETION` | 10 EXP, once per quiz (first submit) |
| `QUIZ_PASS` | 30 EXP, once per quiz (first pass) |
| Mission reward | `Mission.rewardExp`, default 50 |
| Levels (seed) | L1 0 · L2 100 · L3 250 · L4 500 · L5 1000 |
| Reward loop cap | 5 iterations |

## 2.7 AI

| Parameter | Value |
|---|---|
| Max user message | 500 chars |
| Lesson context budget | 6,000 chars plain text (cut at paragraph boundary) |
| Timeout | 30 s |
| Max output tokens | 800 |
| History stored | none |
| Rate limit | see 2.3 |

## 2.8 Frontend

| Parameter | Value |
|---|---|
| Min supported width | 360 px |
| Base font size | ≥ 16 px |
| Query `staleTime` | 30 s default; 0 for dashboard/missions after reward actions (invalidate instead) |
| Query retry | 1 (never retry 4xx) |
| Toast duration | 4 s |

---

# 3. Repository structure (detailed)

```text
history-learning/
├── .github/workflows/ci.yml
├── .husky/                       pre-commit: lint-staged; commit-msg: commitlint
├── .nvmrc                        22 (or 24)
├── .editorconfig  .prettierrc  .gitignore
├── package.json                  root scripts (see 4.3)
├── pnpm-workspace.yaml           packages: ['apps/*', 'packages/*']
├── tsconfig.base.json            strict base config
├── docker-compose.yml
├── docker/postgres/init.sql
├── SPEC.md  PLAYBOOK.md  README.md
│
├── packages/shared/
│   ├── package.json  tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── enums.ts              Role, PublishStatus, Difficulty, QuestionType, CardRarity, ...
│       ├── constants.ts          limits shared by FE/BE (message length, pageSize max, ...)
│       └── schemas/
│           ├── common.ts         pagination, idParam, slug
│           ├── auth.ts           register, login, forgotPassword, resetPassword
│           ├── user.ts
│           ├── taxonomy.ts       topic, period, character, event
│           ├── lesson.ts         lesson upsert (with relations + media), list query
│           ├── quiz.ts           quiz upsert, question upsert, submit
│           ├── gamification.ts   mission, card
│           └── ai.ts
│
├── apps/api/
│   ├── package.json  tsconfig.json  nest-cli.json  jest.config.ts
│   ├── prisma.config.ts          Prisma 7 config (datasource URL, seed command)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/           incl. manual `..._search_extensions/migration.sql`
│   │   └── seed.ts               orchestrates seed/*
│   ├── seed/
│   │   ├── core.ts               education levels, grades, levels, admin/user
│   │   ├── taxonomy.ts           topics, periods
│   │   ├── content/              lessons/*.ts, characters.ts, events.ts (one lesson per file)
│   │   ├── quizzes/              quiz-<lesson-slug>.ts
│   │   └── gamification.ts       missions, cards
│   ├── test/
│   │   ├── setup.ts              uses TEST_DATABASE_URL, migrate + truncate helper
│   │   ├── factories.ts          createUser, createLesson, createQuiz...
│   │   └── *.e2e-spec.ts
│   └── src/
│       ├── main.ts               helmet, cookie-parser, prefix /api, pipes, filters, swagger
│       ├── app.module.ts
│       ├── generated/prisma/     (git-ignored) generated client
│       ├── common/
│       │   ├── config/           env validation (zod), constants.ts
│       │   ├── prisma/           prisma.module.ts, prisma.service.ts, tx.type.ts
│       │   ├── guards/           jwt-auth.guard.ts, roles.guard.ts, origin.guard.ts
│       │   ├── decorators/       public.ts, roles.ts, current-user.ts
│       │   ├── filters/          all-exceptions.filter.ts
│       │   ├── interceptors/     response-envelope.interceptor.ts
│       │   ├── pipes/            (zod validation pipe from nestjs-zod)
│       │   ├── pagination/       paginate.ts, pagination.dto.ts
│       │   ├── errors/           app-error.ts, error-codes.ts
│       │   └── utils/            slugify.ts, html.ts (sanitize, html→text), hash.ts
│       ├── auth/                 auth.module/controller/service, jwt.strategy.ts
│       ├── users/                users.*, admin-users.controller.ts
│       ├── grades/               education-levels + grades (read only)
│       ├── topics/  periods/  characters/  events/      each: module, controller, admin-controller, service
│       ├── lessons/              lessons.*, admin-lessons.controller.ts, lesson-relations.ts
│       ├── media/                upload signing (Cloudinary)
│       ├── progress/             progress.service.ts (start/complete)
│       ├── quizzes/              quizzes.*, admin-quizzes.controller.ts, scoring.ts (pure functions)
│       ├── gamification/
│       │   ├── reward.service.ts       ONLY place that grants rewards
│       │   ├── exp.service.ts  level.service.ts
│       │   ├── missions.service.ts  cards.service.ts
│       │   ├── gamification.constants.ts
│       │   └── *.controller.ts   (levels, missions, exp history, cards, collection)
│       ├── search/               search.service.ts ($queryRaw)
│       ├── dashboard/
│       ├── ai/                   ai.controller/service, prompts/, providers/{ai-provider.ts, anthropic.provider.ts}
│       ├── mailer/
│       └── health/
│
├── apps/web/
│   ├── package.json  tsconfig.json  next.config.ts  components.json  tailwind/postcss config
│   ├── middleware.ts             redirect by cookie presence (UX only)
│   ├── app/
│   │   ├── layout.tsx  providers.tsx  globals.css  not-found.tsx  error.tsx
│   │   ├── (public)/             page.tsx, login, register, forgot-password, reset-password
│   │   ├── (public)/learning/lessons/[slug]/page.tsx     public read
│   │   ├── (user)/               layout.tsx (auth gate + navbar)
│   │   │   ├── dashboard  onboarding/grade  learning  learning/topics/[slug]  learning/characters/[slug]
│   │   │   ├── quiz/[id]  quiz/[id]/result  missions  collection  collection/[id]  progress  ai  profile
│   │   └── (admin)/admin/        layout.tsx (role gate + sidebar)
│   │       └── users topics periods lessons characters events quizzes missions cards
│   ├── components/
│   │   ├── ui/                   shadcn
│   │   ├── admin-crud/           DataTable, EntityForm, ConfirmDialog, StatusBadge, RelationSelect,
│   │   │                         RichTextEditor, ImageUploader, useAdminResource.ts
│   │   ├── layout/               Navbar, MobileNav, AdminSidebar
│   │   └── feedback/             PageSkeleton, EmptyState, ErrorState, RewardDialog, Forbidden
│   ├── features/
│   │   ├── auth/  lessons/  quiz/  gamification/  collection/  ai/  search/
│   │   └── admin/                one config file per entity: topics.config.ts, lessons.config.ts...
│   │       (each feature: api.ts, hooks.ts, components/, types.ts)
│   ├── lib/                      api-client.ts, query-client.ts, sanitize.ts, format.ts, cn.ts
│   └── tests/                    vitest setup
│
└── e2e/                          playwright.config.ts, user-flow.spec.ts, admin-flow.spec.ts
```

---

# 4. Setup (Day 1, do together on one machine, then push)

## 4.1 Commands

```bash
# 0. prerequisites: Node 22/24, corepack enable, Docker
mkdir history-learning && cd history-learning
git init && corepack enable
pnpm init
printf "packages:\n  - 'apps/*'\n  - 'packages/*'\n" > pnpm-workspace.yaml
echo "22" > .nvmrc

# 1. shared package
mkdir -p packages/shared/src && cd packages/shared && pnpm init && pnpm add zod && cd ../..

# 2. API
mkdir apps && cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm --strict --skip-git
cd api
pnpm add @nestjs/config @nestjs/passport @nestjs/jwt @nestjs/throttler @nestjs/swagger \
         passport passport-jwt helmet cookie-parser nestjs-zod zod argon2 sanitize-html \
         nodemailer nestjs-pino pino-http @prisma/client@7 @prisma/adapter-pg pg
pnpm add -D prisma@7 tsx dotenv supertest @types/supertest @types/passport-jwt \
            @types/cookie-parser @types/nodemailer @types/sanitize-html @types/pg pino-pretty
cd ..

# 3. Web
pnpm dlx create-next-app@latest web --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-pnpm
cd web && pnpm dlx shadcn@latest init
pnpm add @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers zod \
         dompurify @tiptap/react @tiptap/starter-kit sonner
cd ../..

# 4. infra
cp apps/api/.env.example apps/api/.env   # kit already provides .env.example
cp apps/web/.env.example apps/web/.env.local
docker compose up -d
```

Then copy the kit files (`schema.prisma`, `docker-compose.yml`, `init.sql`, env examples) into place.

## 4.2 Prisma 7 config

`apps/api/prisma.config.ts`

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
```

> `npx prisma init` output for your installed version is the source of truth for this file. If it differs, follow the generated file.

First migration, then the manual search migration:

```bash
cd apps/api
pnpm prisma migrate dev --name init
pnpm prisma migrate dev --create-only --name search_extensions   # then paste SQL below
pnpm prisma migrate dev
pnpm prisma studio
```

`..._search_extensions/migration.sql`

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

CREATE INDEX lessons_title_trgm_idx ON lessons
  USING gin (immutable_unaccent(lower(title)) gin_trgm_ops);
CREATE INDEX topics_name_trgm_idx ON topics
  USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);
CREATE INDEX characters_name_trgm_idx ON historical_characters
  USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);
```

Query pattern (parameterized):

```ts
this.prisma.$queryRaw`
  SELECT id, title, slug FROM lessons
  WHERE status = 'PUBLISHED'
    AND immutable_unaccent(lower(title)) ILIKE '%' || immutable_unaccent(lower(${q})) || '%'
  LIMIT 5`;
```

Verify on day 1 that `Đ`/`đ` are handled (`SELECT unaccent('Trần Hưng Đạo')` must return `Tran Hung Dao`). If not, add a `translate(..., 'đĐ', 'dD')` step inside `immutable_unaccent`.

## 4.3 Root scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel --filter ./apps/* dev",
    "dev:api": "pnpm --filter api start:dev",
    "dev:web": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter api prisma migrate dev",
    "db:deploy": "pnpm --filter api prisma migrate deploy",
    "db:seed": "pnpm --filter api prisma db seed",
    "db:studio": "pnpm --filter api prisma studio",
    "db:reset": "pnpm --filter api prisma migrate reset --force"
  }
}
```

## 4.4 Day 1 exit criteria

```text
[ ] docker compose up → Postgres healthy, Mailpit at :8025
[ ] pnpm dev → web :3000 and api :4000 both run on BOTH machines
[ ] migrate applied; Prisma Studio shows all tables
[ ] GET /api/health returns { success: true }
[ ] Swagger at /api/docs
[ ] lint + typecheck pass in CI on an empty PR
```

---

# 5. Conventions

## 5.1 Git

* Trunk-based. `main` is protected: PR + 1 approval from the other developer + green CI. Squash merge.
* Branch names: `feat/<area>-<short>`, `fix/...`, `chore/...`, `docs/...`. Max lifetime 3 days.
* Conventional Commits: `feat(quiz): score multiple choice`, `fix(auth): reject banned users`. Types: feat, fix, chore, docs, test, refactor.
* PR ≤ 400 changed lines when possible; description lists what was tested and screenshots for UI.
* Schema changes: separate PR, tagged `schema`, both developers review.

## 5.2 Naming

| Item | Rule |
|---|---|
| Files | kebab-case (`admin-lessons.controller.ts`), React components PascalCase file names allowed |
| DB tables | snake_case plural via `@@map`; Prisma models PascalCase singular |
| Routes | plural nouns, kebab-case, no verbs except actions (`/start`, `/complete`, `/submit`, `/claim`) |
| DTO/Schema | `CreateLessonSchema`, `UpdateLessonSchema` in `packages/shared`; DTO class via `createZodDto` |
| Error codes | `UPPER_SNAKE_CASE`, defined once in `error-codes.ts` |
| Env vars | `UPPER_SNAKE_CASE`; validated at startup, app crashes if invalid |

## 5.3 Backend patterns

* Controller: parse input, call service, return data. No business logic.
* Service: business logic. Throws `AppError(code, status, message)`.
* Response envelope and error format are applied by the interceptor and filter, never by hand.
* Every list endpoint uses `paginate()` helper. Every write endpoint validates with Zod.
* Public queries always filter `status = PUBLISHED` (lessons/quizzes) or `ACTIVE` (others). Put this in a query helper so it cannot be forgotten.
* Use `select`/`include` explicitly. Never return `passwordHash`.
* `$queryRaw` only with tagged template parameters.
* Any code that changes EXP/mission/card runs inside `prisma.$transaction(async (tx) => ...)` and goes through `RewardService`.

## 5.4 Frontend patterns

* `app/` pages are thin: they compose components from `features/`.
* Server state: TanStack Query only. No global store library in MVP. Local UI state with `useState`.
* All HTTP through `lib/api-client.ts` (handles envelope, 401 redirect, error mapping).
* Query keys: `['lessons', filters]`, `['lesson', slug]`, `['dashboard']`, `['missions']`, `['collection']`.
* Every screen uses `PageSkeleton`, `EmptyState`, `ErrorState` components; no ad-hoc spinners.
* Forms: React Hook Form + Zod resolver using schemas from `packages/shared`.
* Admin pages: config-driven with `admin-crud`. New custom table/form code needs a reason in the PR.

## 5.5 Testing pattern

* Backend integration tests hit a real Postgres (`TEST_DATABASE_URL`), not mocks. Each test file resets tables in `beforeEach`.
* Pure logic (scoring, level calculation, slugify) gets plain unit tests.
* Test names describe behavior: `it('grants lesson EXP only once when completed twice')`.
* CI runs: install (frozen lockfile) → typecheck → lint → test → build.

---

# 6. Critical code skeletons

## 6.1 Response envelope and errors

```ts
// common/errors/app-error.ts
export class AppError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}
// filter output:  { success: false, message, errorCode }
// interceptor output: { success: true, data }
```

## 6.2 Prisma service (Prisma 7 + adapter)

```ts
// common/prisma/prisma.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../../generated/prisma/client';

export type Tx = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.getOrThrow('DATABASE_URL') }) });
  }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

## 6.3 Idempotent EXP grant

> Correction to SPEC 8.4: do **not** "catch the unique violation" inside a transaction. In PostgreSQL a failed statement aborts the whole transaction. Use `skipDuplicates` (`ON CONFLICT DO NOTHING`) and read `count`.

```ts
// gamification/exp.service.ts
async grant(tx: Tx, userId: string, amount: number, type: ExpType, referenceId: string, description?: string) {
  const { count } = await tx.expTransaction.createMany({
    data: [{ userId, amount, type, referenceId, description }],
    skipDuplicates: true,
  });
  if (count === 0) return 0;                       // already granted
  await tx.user.update({ where: { id: userId }, data: { totalExp: { increment: amount } } });
  return amount;
}
```

## 6.4 First-completion detection (race safe)

```ts
// progress/progress.service.ts  (inside $transaction)
await tx.lessonProgress.upsert({
  where: { userId_lessonId: { userId, lessonId } },
  create: { userId, lessonId, status: 'IN_PROGRESS', startedAt: new Date() },
  update: {},
});
const { count } = await tx.lessonProgress.updateMany({
  where: { userId, lessonId, completedAt: null },
  data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
});
const isFirstCompletion = count === 1;            // concurrent request sees count 0
if (isFirstCompletion) reward = await this.rewards.onLessonCompleted(tx, userId, lessonId);
```

## 6.5 RewardService shape

```ts
export interface RewardResult {
  earnedExp: number;
  levelUp: { from: string; to: string } | null;
  unlockedCards: CardSummary[];
  updatedMissions: MissionProgressSummary[];
}

async onLessonCompleted(tx: Tx, userId: string, lessonId: string): Promise<RewardResult> {
  const before = await this.levels.forUser(tx, userId);
  let earned = await this.exp.grant(tx, userId, EXP.LESSON_COMPLETION, 'LESSON_COMPLETION', lessonId);
  const ctx = { newLesson: lessonId };
  const { missions, cards } = await this.settle(tx, userId, [{ kind: 'LESSON_COMPLETE', refId: lessonId }]);
  const after = await this.levels.forUser(tx, userId);
  return { earnedExp: earned, levelUp: before.id !== after.id ? { from: before.name, to: after.name } : null,
           unlockedCards: cards, updatedMissions: missions };
}
// settle(): loop ≤ 5: advance missions → unlock cards (lesson/quiz/level) → new cards advance COLLECT_CARD → repeat until no change
```

## 6.6 Cookie login

```ts
res.cookie(COOKIE_NAME, token, {
  httpOnly: true, secure: isProd, sameSite: 'lax', path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, domain: cookieDomain || undefined,
});
```

## 6.7 Origin check (CSRF for cookie auth)

```ts
// guards/origin.guard.ts — apply globally for POST/PUT/PATCH/DELETE
const origin = req.headers.origin ?? new URL(req.headers.referer ?? 'http://x').origin;
if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.cookies?.[COOKIE_NAME] && origin !== WEB_ORIGIN)
  throw new AppError('FORBIDDEN', 403, 'Invalid origin');
```

Behind the Next.js proxy the `Origin` header is the web origin, so `WEB_ORIGIN` must equal the public web URL.

## 6.8 Next.js proxy

```ts
// apps/web/next.config.ts
const config = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.API_INTERNAL_URL}/api/:path*` }];
  },
};
export default config;
```

## 6.9 Scoring (pure function, unit-tested)

```ts
export function scoreQuestion(q: { type: QuestionType; points: number; answers: {id: string; isCorrect: boolean}[] },
                              selected: string[]): { correct: boolean; points: number } {
  const correctIds = q.answers.filter(a => a.isCorrect).map(a => a.id).sort();
  const picked = [...new Set(selected)].sort();
  const correct = correctIds.length === picked.length && correctIds.every((id, i) => id === picked[i]);
  return { correct, points: correct ? q.points : 0 };
}
```

---

# 7. Nine-week plan (day by day)

Legend: **A** = backend-leaning developer, **B** = frontend-leaning developer. "Both" = pair or split by area. Deploy to production-like environment from week 2 and keep it green.

## Week 1 — Foundation and schema

| Day | Dev A | Dev B |
|---|---|---|
| Mon | Repo, pnpm workspace, Nest + Prisma scaffold, docker compose (Both, one machine) | same session |
| Tue | Spikes 1–2 (nestjs-zod, Prisma 7 CJS); migrate `schema.prisma`; search migration | Spikes 3–5; Next.js + Tailwind + shadcn base; `packages/shared` skeleton |
| Wed | Env validation, PrismaModule, response envelope, exception filter, health, Swagger | API client, query client, providers, base layout, PageSkeleton/EmptyState/ErrorState |
| Thu | Seed core (levels, grades, admin, demo user); CI workflow | Design tokens, navbar, mobile nav, auth page shells |
| Fri | **Schema review together against SPEC section 17 flows; freeze**; pick and write first 2 lessons' content outline | Setup Husky, commitlint, lint-staged; README |

Exit: Day 1 criteria (4.4) + schema frozen + CI green.

## Week 2 — Auth and first deploy

| Day | Dev A | Dev B |
|---|---|---|
| Mon | Register (Argon2, Zod) + tests | Register/login forms with RHF+Zod |
| Tue | Login (cookie), logout, `/auth/me`, JwtStrategy (loads user, blocks BANNED) | Auth state hook, route gate, 401 handling |
| Wed | Guards: JwtAuthGuard global + `@Public`, RolesGuard, OriginGuard; throttler; helmet | Onboarding grade page, profile page |
| Thu | `PATCH /users/me` (gradeId), `GET /grades`, tests (403 for USER on admin route) | Navbar with user menu, logout |
| Fri | **Deploy**: DB (Neon/Supabase), API (Render/Railway), web (Vercel), env vars, `migrate deploy` in pipeline | Verify rewrite + cookie on deployed URL; fix issues |

Exit: register → login → select grade works on the public URL.

## Week 3 — Admin foundation and taxonomy

| Day | Dev A | Dev B |
|---|---|---|
| Mon | Admin Topics CRUD + public `GET /topics` + `paginate()` + tests | `admin-crud` v1 built on Topics: DataTable (server pagination, search, status filter) |
| Tue | Admin Periods CRUD | EntityForm (config-driven), ConfirmDialog, StatusBadge; Topics page done |
| Wed | Admin Characters CRUD (soft delete) | Extract config pattern; Periods page |
| Thu | Admin Events CRUD; slugify util | Characters + Events pages; ImageUploader (Cloudinary signed upload) |
| Fri | Media signing endpoint; admin users list/patch | Admin users page; admin layout guard | 

Also this week: **Both write seed content for topics, periods, 6 characters, 6 events.**
Exit: admin manages all taxonomy from generic components.

## Week 4 — Lessons

| Day | Dev A | Dev B |
|---|---|---|
| Mon | Lesson admin create/update with relations replace-all in tx; sanitize-html | RichTextEditor (Tiptap) + RelationSelect |
| Tue | Publish validation, media in body, soft delete; tests | Lessons admin page (form with tabs: content, relations, media) |
| Wed | `GET /lessons` composable filters + pagination + published-only helper | `/learning` list page with filter bar (grade default from profile) |
| Thu | `GET /lessons/:slug` (public; progress if authed), tests for filter combinations | Lesson detail page (DOMPurify, media gallery, related characters/events) |
| Fri | Buffer / catch-up; seed 4 lessons | Buffer / mobile pass on list and detail |

Exit: admin creates lesson → user filters by grade + topic → opens it.

## Week 5 — Progress and search

| Day | Dev A | Dev B |
|---|---|---|
| Mon | `start` and `complete` endpoints (6.4 pattern), no rewards yet (stub) | Complete button, states, optimistic UI off (server is truth) |
| Tue | Concurrency test: parallel `complete` → one first-completion | `/progress` page |
| Wed | Search service (unaccent + trigram), `GET /search` | Search bar + results dropdown, debounce |
| Thu | `GET /characters/:slug` with related lessons/events; `GET /users/me/progress` | Character page, topic shortcut page |
| Fri | Buffer; seed 4 more lessons | Buffer; empty/error states review |

Exit: lesson flow complete; "tran hung dao" finds "Trần Hưng Đạo".

## Week 6 — Quiz

| Day | Dev A | Dev B |
|---|---|---|
| Mon | Quiz + question + answers admin API with publish validation | Quiz editor UI (questions/answers repeater) |
| Tue | `start` (open-attempt logic), `GET quiz` without correct answers | Quiz taking UI (one question per screen on mobile, timer) |
| Wed | `submit`: validate, `scoring.ts`, save attempt+answers (rewards stub) + unit tests | Submit flow, confirm dialog |
| Thu | Result payload with review; history; `GET /quiz-attempts/:id` (owner only) | Result page (score, review, explanations), history list |
| Fri | Tests: hidden answers, time limit, wrong ids, multi-choice; seed 6 quizzes | Buffer; polish |

Exit: full quiz loop with server-side scoring, tests green.

## Week 7 — Rewards, missions, cards, dashboard

| Day | Dev A | Dev B |
|---|---|---|
| Mon | ExpService + LevelService + `/levels`, `/exp/history` + tests (99/100/249/250 boundaries) | RewardDialog (EXP, level up, cards); wire to lesson complete |
| Tue | RewardService + hook into lesson complete and quiz submit (single tx) | Wire to quiz result; invalidate queries |
| Wed | Missions progress + claim + tests (double claim, distinct events only) | Missions page; admin missions page |
| Thu | Cards: unlock rules, collection endpoints, cascade loop; tests | Collection + card detail; admin cards page |
| Fri | Dashboard API | Dashboard page; buffer |

Exit: core loop works end to end; concurrency tests pass.

## Week 8 — AI, mail, E2E

| Day | Dev A | Dev B |
|---|---|---|
| Mon | AiProvider interface + one adapter; `/ai/chat` ASK mode; rate limits | AI page (chat UI, notice text) |
| Tue | Lesson context builder, EXPLAIN/SUMMARIZE modes; prompt-injection guard | "Ask AI" entry buttons on lesson page |
| Wed | Mailer + forgot/reset password + tests | Forgot/reset pages |
| Thu | Playwright user flow (SPEC 17) | Playwright admin flow |
| Fri | Fix E2E failures; Swagger review | Fix E2E failures; responsive pass |

Exit: SPEC section 17 acceptance flows pass on the deployed build.

## Week 9 — Stabilize (no new features)

| Day | Dev A | Dev B |
|---|---|---|
| Mon | Security review checklist (SPEC 12.3), dependency audit | Loading/empty/error audit on every screen |
| Tue | Log review (no PII/secrets), rate-limit verification | 360 px and desktop pass |
| Wed | Seed completion to demo minimum, production data check | Seed content review against textbook |
| Thu | Backup restore test, env review, README, final bugs | Final bugs, accessibility quick pass (contrast, focus) |
| Fri | Demo rehearsal, tag `v1.0.0` | Demo rehearsal |

## Weekly rituals

* **Mon 30 min:** plan the week, confirm API contracts (Zod schemas in `shared` first).
* **Daily 10 min:** what I did, what I'm doing, blocked?
* **Fri 45 min:** demo the deployed build to each other; update SPEC changelog; decide cuts using SPEC 16.1 if any day-of-slip > 2.

---

# 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Neither dev knows NestJS | Lost ~1 week | Do spike 1–2 on day 2; if slow, switch to Next.js full-stack (update SPEC first) |
| Render free tier sleeps (cold start ~30–60 s) | Bad demo | Pay for the smallest always-on instance in weeks 8–9, or use a keep-alive ping; test cold start before demo |
| Seed content takes too long | Empty demo | 3–4 lessons + quiz per week from week 3; demo minimum only |
| Reward bugs (double EXP) | Trust in data | Unique constraint + `skipDuplicates` + concurrency tests (week 5 and 7) |
| Schema change late | Cascade of rework | Freeze after week 1; changes via SPEC PR only |
| Prisma 7 / Nest CJS friction | Blocked on day 1 | Spike 2; fallback: pin Prisma 6 (`prisma-client-js`) and record in SPEC |
| Cookie not sent across domains | Login broken in prod | Use the Next.js proxy (same origin); test on deployed URL in week 2 |
| Scope creep | Miss deadline | SPEC section 2 and cut order; P2 forbidden before week 9 |
| AI cost/abuse | Bill surprise | Per-user limits, 500-char input, 800 output tokens, provider spending cap |

---

# 9. Ready-to-start checklist

```text
[ ] Both developers read SPEC.md and PLAYBOOK.md fully
[ ] Roles agreed (A backend-leaning, B frontend-leaning) and week 1 tasks assigned
[ ] GitHub repo created, main protected, CI file present
[ ] Accounts created: Vercel, Render or Railway, Neon or Supabase, Cloudinary, SMTP provider, LLM API key
[ ] Node/pnpm/Docker installed on both machines (same Node major)
[ ] Decide: keep NestJS or switch to Next.js full-stack (decide before day 2)
[ ] Decide: quiz behavior when time limit expires (SPEC 8.2)
[ ] Textbook / source list for History content agreed
```
