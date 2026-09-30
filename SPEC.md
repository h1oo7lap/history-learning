# History Learning Platform — SPEC v2 (2 developers, 9 weeks)

> This version replaces v1. All changes versus v1 are listed in **Appendix A** so the team can trace decisions (Vibe Coding Rule 3).

---

# 1. Project Overview

A full-stack web application that supports History learning for Vietnamese students from Grade 4 to Grade 12.

Core product loop (every decision must serve this loop):

```text
LEARN → PRACTICE → EARN EXP → COMPLETE MISSION → COLLECT HISTORY CARD → CONTINUE LEARNING
```

Supporting features: Admin content management, search/discovery, dashboard, AI History Assistant (supporting tool, never the center).

## 1.1 Project constraints

| Constraint | Value |
|---|---|
| Team | 2 developers (Dev A: backend-leaning, Dev B: frontend-leaning) |
| Timeline | 9 weeks (weeks 1–8 build, week 9 stabilization only) |
| Users | Students Grade 4–12 (many are minors), mostly on mobile phones |
| UI language | Vietnamese only (no i18n in MVP) |
| Hosting budget | Free/low-cost tiers |

## 1.2 Design principles

1. History content is NOT hard-coded around one grade. A lesson connects to grades, topics, periods, characters, events via many-to-many relations.
2. All business logic (score, EXP, level, missions, cards, roles) lives in the backend. The frontend only displays.
3. Reward logic lives in ONE place (`RewardService`, section 8) and runs in ONE database transaction.
4. Prefer generic, reusable building blocks (generic admin CRUD, shared Zod schemas) over per-entity code.
5. Do not build future features. If it is not in this SPEC, ask first.

---

# 2. Scope

## 2.1 Priorities

**P0 — Must have (weeks 1–6)**

```text
Auth (register/login/logout/me), Role, Profile, Select grade
Grade, Topic, Period, Character, Event, Lesson (+ relations, media)
Content discovery (filters + search)
Lesson progress (start/complete)
Quiz, Question, Answer, Attempt, Result, History
Admin CRUD (generic)
Security basics, Deployment
```

**P1 — Important (weeks 7–8)**

```text
EXP + ExpTransaction, Level
Mission (+ claim)
History Card + unlock + Collection
Dashboard
AI chat (single endpoint, non-streaming)
Forgot/reset password + Mailer
Character detail page (related lessons/events)
```

**P2 — Enhancement (only if ahead of schedule)**

```text
AI streaming, Timeline, Leaderboard, Achievements, Interactive map,
Advanced recommendation, Search for Event/History Card, Admin UI for Education Level/Grade/Level
```

P2 must NOT block P0/P1.

## 2.2 Explicitly out of scope for MVP

```text
Redis, refresh tokens, email verification, social login, payments,
notifications, comments, teacher/parent roles, offline mode,
i18n, native mobile app, admin audit log, partial lesson progress (% scroll tracking)
```

---

# 3. User Roles

## 3.1 USER

Register, login, logout, manage profile, select grade, browse/filter/search content, view lessons, complete lessons, take quizzes, view results, gain EXP, level up, claim missions, collect cards, view progress, chat with AI.

## 3.2 ADMIN

Manage users (list, change status/role), topics, periods, lessons (including media), characters, events, quizzes (including questions and answers), missions, cards. View dashboard.

Education levels, grades and levels are **seed-managed** in MVP (no admin UI; P2).

Admin routes/APIs are protected by role-based authorization enforced on the backend.

---

# 4. Technology & Repository

## 4.1 Stack (final)

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript (strict), TailwindCSS, shadcn/ui, TanStack Query, TanStack Table, React Hook Form, Zod, Tiptap |
| Backend | NestJS, TypeScript (strict), nestjs-zod, Passport-JWT, @nestjs/throttler, helmet, @nestjs/swagger, pino |
| Database | PostgreSQL 16 + Prisma ORM; extensions `unaccent`, `pg_trgm` |
| Auth | JWT in httpOnly cookie, Argon2 |
| Media | Cloudinary (or Supabase Storage). DB stores URL only |
| AI | LLM API called from backend only, behind an `AiProvider` interface |
| Mail | Nodemailer + SMTP (Brevo/Resend in prod, Mailpit in dev) |
| Sanitizing | `sanitize-html` (backend, on save), `DOMPurify` (frontend, on render) |
| Tests | Jest + Supertest (backend), Vitest + Testing Library (frontend), Playwright (E2E) |
| Tooling | pnpm workspaces, Docker Compose, ESLint, Prettier, Husky, lint-staged, GitHub Actions |
| Deploy | Frontend → Vercel; Backend → Render/Railway (region Singapore); DB → Neon/Supabase/Railway (Singapore, backups on) |

> If neither developer has used NestJS before week 1, the team may replace NestJS with Next.js Route Handlers + Prisma. This requires updating this SPEC first (Rule 3) and keeping the same module boundaries (section 4.2).

## 4.2 Repository structure

```text
history-learning/
├── frontend/                     # Next.js
│   ├── app/
│   ├── components/
│   │   ├── ui/                   # shadcn/ui
│   │   └── admin-crud/           # generic table/form/dialog (used by ALL admin pages)
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── types/
├── backend/                      # NestJS
│   ├── src/
│   │   ├── auth/  users/  grades/  topics/  periods/
│   │   ├── lessons/  characters/  events/  media/
│   │   ├── quizzes/  progress/  gamification/   # gamification = EXP, level, missions, cards, RewardService
│   │   ├── search/  dashboard/  ai/  mailer/  common/
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/           # includes manual SQL for unaccent/pg_trgm
│       └── seed.ts
├── packages/
│   └── shared/                   # Zod schemas, enums, DTO types shared by frontend and backend
├── docker-compose.yml            # postgres + mailpit
└── SPEC.md
```

Root uses pnpm workspaces (`frontend`, `backend`, `packages/*`).

## 4.3 Environment variables

```text
DATABASE_URL
JWT_SECRET, JWT_EXPIRES_IN=7d
COOKIE_DOMAIN (optional), NODE_ENV
WEB_ORIGIN                      # CORS + Origin check
API_INTERNAL_URL                # used by Next.js rewrite
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
CLOUDINARY_* (or SUPABASE_*)
AI_PROVIDER, AI_API_KEY, AI_MODEL
```

Secrets exist only on the backend / hosting dashboard. Never commit `.env`. Provide `.env.example`.

---

# 5. Content Architecture

```text
History
├── EducationLevel (PRIMARY, SECONDARY, HIGH_SCHOOL)
│   └── Grade (4 … 12)
├── Topic
├── HistoricalPeriod
├── HistoricalCharacter
├── HistoricalEvent
└── Lesson  ── many-to-many ──> Grade, Topic, Period, Character, Event
        ├── LessonMedia (1:N)
        └── Quiz (0..1 in MVP)
```

Do NOT use `Lesson.gradeId`, `Lesson.topicId`, `Lesson.periodId` as the only relationship. Use join tables.

Visibility rule: end users and public endpoints only see entities with `status = PUBLISHED` / `ACTIVE`. Admin sees all.

---

# 6. Data Model

Conventions:

* IDs: `String` (cuid or uuid), generated by Prisma.
* Every table has `createdAt`; mutable tables have `updatedAt`.
* Important content is never hard-deleted: use `status` (`ARCHIVED` / `INACTIVE`).
* Enums are defined once in `packages/shared` and mirrored in Prisma.

## 6.1 Identity

```text
User
- id, email (UNIQUE, lowercase), passwordHash, fullName, avatar
- role: USER | ADMIN
- gradeId (nullable until user selects grade)
- totalExp (cached, default 0)
- status: ACTIVE | INACTIVE | BANNED
- createdAt, updatedAt

PasswordResetToken
- id, userId, tokenHash (SHA-256 of random token), expiresAt (30 min), usedAt, createdAt
```

## 6.2 Classification

```text
EducationLevel  (id, name, code UNIQUE, description, displayOrder, status, createdAt, updatedAt)
Grade           (id, educationLevelId, name, code UNIQUE, displayOrder, status, createdAt, updatedAt)
Topic           (id, name, slug UNIQUE, description, thumbnail, displayOrder, status, createdAt, updatedAt)
HistoricalPeriod(id, name, slug UNIQUE, description, startYear?, endYear?, displayOrder, status, createdAt, updatedAt)
```

`EducationLevel 1:N Grade`. `Topic.status` and `Period.status`: `ACTIVE | INACTIVE`.

## 6.3 Lesson and relations

```text
Lesson
- id, title, slug UNIQUE, summary, content (sanitized rich text/HTML), thumbnail
- difficulty: EASY | MEDIUM | HARD
- estimatedTime (minutes)
- displayOrder (int, default 0)
- status: DRAFT | PUBLISHED | ARCHIVED
- createdAt, updatedAt

LessonGrade      (lessonId, gradeId)                 PK(lessonId, gradeId)
LessonTopic      (lessonId, topicId)                 PK(lessonId, topicId)
LessonPeriod     (lessonId, periodId)                PK(lessonId, periodId)
LessonCharacter  (lessonId, characterId, role?)      PK(lessonId, characterId)
LessonEvent      (lessonId, eventId)                 PK(lessonId, eventId)

LessonMedia
- id, lessonId, type: IMAGE | VIDEO | AUDIO | DOCUMENT
- url, title, description, displayOrder, createdAt

HistoricalCharacter
- id, name, slug UNIQUE, avatar, shortDescription, biography, birthYear?, deathYear?, createdAt, updatedAt

HistoricalEvent
- id, name, slug UNIQUE, description, startDate?, endDate?, location?, createdAt, updatedAt
```

Publish validation (backend): a lesson can be `PUBLISHED` only if it has title, slug, content, and at least one grade.

## 6.4 Learning progress

```text
LessonProgress
- id, userId, lessonId
- status: NOT_STARTED | IN_PROGRESS | COMPLETED
- progress: 0..100      (MVP: 0 when started, 100 when completed)
- startedAt, completedAt, createdAt, updatedAt
- UNIQUE(userId, lessonId)
```

## 6.5 Quiz

```text
Quiz
- id, lessonId (UNIQUE in MVP → max one quiz per lesson), title, description
- timeLimit (seconds, nullable = unlimited)
- passScore (percentage 0..100, default 60)
- status: DRAFT | PUBLISHED | ARCHIVED
- createdAt, updatedAt

Question
- id, quizId, content
- type: SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE
- points (default 1), explanation, displayOrder, createdAt, updatedAt

Answer
- id, questionId, content, isCorrect, displayOrder

QuizAttempt
- id, userId, quizId
- startedAt
- submittedAt (null until submitted)
- score, totalScore, correctAnswers, totalQuestions  (null until submitted)
- passed (bool, null until submitted)

QuizAttemptAnswer
- id, attemptId, questionId, answerId, isCorrect
  (one row per selected answer; MULTIPLE_CHOICE has several rows per question)
```

Quiz validation (backend, on publish): at least 1 question; SINGLE_CHOICE and TRUE_FALSE have exactly 1 correct answer (TRUE_FALSE has exactly 2 answers); MULTIPLE_CHOICE has at least 1 correct answer and at least 2 answers.

## 6.6 Gamification

```text
ExpTransaction
- id, userId, amount, type, referenceId, description, createdAt
- type: LESSON_COMPLETION | QUIZ_COMPLETION | QUIZ_PASS | MISSION_COMPLETION | OTHER
- UNIQUE(userId, type, referenceId)   -- idempotency: the same reward can never be granted twice
  (for type OTHER, referenceId must be a unique generated id)

Level
- id, name, requiredExp (UNIQUE), displayOrder
  (Level 1 must have requiredExp = 0)

Mission
- id, title, description
- type: COMPLETE_LESSON | COMPLETE_QUIZ | PASS_QUIZ | COLLECT_CARD
- target (int > 0), rewardExp, rewardCardId?
- status: ACTIVE | INACTIVE
- createdAt, updatedAt

UserMission
- id, userId, missionId, progress, completed, completedAt, claimedAt
- UNIQUE(userId, missionId)
```

Current level is always derived: the level with the highest `requiredExp <= user.totalExp`. Never store current level as the only source of truth.

## 6.7 Collection

```text
HistoryCard
- id, name, slug UNIQUE
- type: CHARACTER | EVENT | ARTIFACT | LOCATION
- rarity: COMMON | RARE | EPIC | LEGENDARY
- image, shortDescription, description
- periodId? (FK → HistoricalPeriod)
- unlockType: NONE | LESSON_COMPLETE | QUIZ_PASS | LEVEL_REACH | MISSION_REWARD
- unlockRefId? (lessonId | quizId | levelId, validated in service by unlockType)
- status: ACTIVE | INACTIVE
- createdAt, updatedAt

UserCard
- id, userId, cardId, obtainedAt
- UNIQUE(userId, cardId)
```

`MISSION_REWARD` cards are granted through `Mission.rewardCardId` on claim. `NONE` cards are display-only or granted manually later.

## 6.8 Constraints, indexes, delete behavior

```text
UNIQUE: User.email, Lesson.slug, Topic.slug, HistoricalPeriod.slug, HistoricalCharacter.slug,
        HistoricalEvent.slug, HistoryCard.slug, Quiz.lessonId,
        LessonProgress(userId, lessonId), UserCard(userId, cardId), UserMission(userId, missionId),
        ExpTransaction(userId, type, referenceId)

INDEX:  Lesson(status), LessonGrade(gradeId), LessonTopic(topicId), LessonPeriod(periodId),
        QuizAttempt(userId, quizId), ExpTransaction(userId, createdAt),
        GIN trigram indexes on unaccented Lesson.title, Topic.name, HistoricalCharacter.name

ON DELETE:
  Join tables and LessonMedia      → CASCADE from Lesson
  Question / Answer                → CASCADE from Quiz / Question
  QuizAttempt.quizId, UserCard.cardId, LessonProgress.lessonId, Grade/Topic/Period/Character/Event
                                   → RESTRICT (archive instead of delete)
  User-owned rows                  → RESTRICT (users are deactivated, not deleted)
```

---

# 7. Content Rules

## 7.1 Lesson content

* `Lesson.content` is rich text (Tiptap → HTML). Sanitize on save (backend) and on render (frontend).
* Images/videos/audio/documents are stored in `LessonMedia`, never as URL columns on `Lesson`.
* Media handling: IMAGE = uploaded to Cloudinary (max 5 MB, jpg/png/webp); VIDEO = external embed URL (e.g. YouTube), not uploaded; AUDIO/DOCUMENT = URL (upload optional).
* Media is managed inside the lesson editor. There is no separate `/admin/media` page.

## 7.2 Lesson relations in admin API

Create/update lesson accepts:

```json
{
  "gradeIds": [],
  "topicIds": [],
  "periodIds": [],
  "characters": [{ "characterId": "", "role": "" }],
  "eventIds": [],
  "media": [{ "type": "IMAGE", "url": "", "title": "", "displayOrder": 0 }]
}
```

The backend replaces all relations inside one transaction.

## 7.3 Discovery

Users discover content by Grade, Topic, Period, Character, Event, and Search. Filters are composable:

```text
GET /api/lessons?gradeId=7&topicId=2&periodId=5&difficulty=MEDIUM&search=tran&page=1&pageSize=20
```

Semantics: different filters combine with AND; multiple values of the same filter (comma-separated) combine with OR.

Default `gradeId` in UI = the user's selected grade (user can change it).

## 7.4 Search (Vietnamese, accent-insensitive)

* Searching `tran hung dao` must find `Trần Hưng Đạo`.
* Implementation: PostgreSQL `unaccent` + `pg_trgm` via manual SQL migration and `$queryRaw`.
* MVP searches: Lesson, Topic, Character. (Event and History Card search = P2.)
* Endpoint: `GET /api/search?q=` returns grouped results `{ lessons, topics, characters }`, max 5 per group. Only published/active items.

---

# 8. Business Rules (Backend Only)

## 8.1 Lesson progress

* `POST /api/lessons/:id/start`: create or update progress to `IN_PROGRESS`. Idempotent. Never downgrades `COMPLETED`.
* `POST /api/lessons/:id/complete`: see below.

Complete lesson:

1. Lesson must exist and be `PUBLISHED`.
2. In one transaction: upsert `LessonProgress` → `COMPLETED`, `progress = 100`, set `completedAt` only if not already set.
3. If this is the **first** completion: call `RewardService` with `LESSON_COMPLETED`.
4. Repeating the call returns the same progress and `earnedExp = 0`. It must NOT award anything again.

## 8.2 Quiz

Flow:

```text
POST /api/quizzes/:id/start   → creates QuizAttempt (startedAt), returns questions WITHOUT isCorrect
POST /api/quizzes/:id/submit  → validates, scores, saves, rewards
```

Rules:

1. Authenticated user; quiz exists and is `PUBLISHED`.
2. `submit` must reference an open attempt (`submittedAt IS NULL`) owned by the user. If no attempt id is sent, use the latest open attempt.
3. If `timeLimit` is set and `now > startedAt + timeLimit + 10s grace` → reject with `QUIZ_TIME_EXPIRED` (or score as submitted; pick one in week 6 and document it).
4. Validate every `questionId`/`answerId` belongs to this quiz. Ignore unknown; reject duplicates.
5. Scoring (server-side only, never trust client score):
   * SINGLE_CHOICE / TRUE_FALSE: correct if the chosen answer `isCorrect`.
   * MULTIPLE_CHOICE: all-or-nothing. Correct only if the selected set equals the correct set.
   * Points per question = `Question.points` if correct, else 0.
6. `percentage = score / totalScore * 100`; `passed = percentage >= passScore`.
7. Save attempt + answers, then call `RewardService` with `QUIZ_SUBMITTED`.
8. Correct answers/explanations are only returned **after** submission (in the result).

Result payload:

```json
{
  "attemptId": "",
  "score": 8,
  "totalScore": 10,
  "percentage": 80,
  "correctAnswers": 4,
  "totalQuestions": 5,
  "passed": true,
  "earnedExp": 40,
  "levelUp": { "from": "Level 1", "to": "Level 2" },
  "unlockedCards": [],
  "updatedMissions": [],
  "review": [{ "questionId": "", "isCorrect": true, "correctAnswerIds": [], "explanation": "" }]
}
```

Attempts are unlimited, but EXP is granted only once per quiz per reward type (see 8.3). Later attempts are practice.

## 8.3 RewardService (single source of truth for rewards)

One class, one public method per event, always called **inside the caller's Prisma transaction**:

```text
RewardService.onLessonCompleted(tx, userId, lessonId)
RewardService.onQuizSubmitted(tx, userId, quizId, attempt)
RewardService.onMissionClaimed(tx, userId, missionId)
```

Every event runs the same pipeline:

```text
1. Grant EXP           (ExpService.grant — idempotent, see 8.4)
2. Update missions     (8.6)
3. Check card unlocks  (8.7)
4. Compute level       (derived from totalExp; report levelUp if it changed)
5. Return { earnedExp, levelUp, unlockedCards, updatedMissions }
```

Steps 2–3 can trigger each other (a new card advances `COLLECT_CARD` missions; a new level unlocks `LEVEL_REACH` cards). Loop until nothing changes, with a hard cap of 5 iterations.

No other module may write to `ExpTransaction`, `UserMission`, `UserCard`, or `User.totalExp`.

## 8.4 EXP

Default values (backend constants file, single place to change):

```text
LESSON_COMPLETION: 20   (once per user per lesson)
QUIZ_COMPLETION:   10   (once per user per quiz — first submitted attempt)
QUIZ_PASS:         30   (once per user per quiz — first passing attempt)
MISSION_COMPLETION: uses Mission.rewardExp (default seed value 50)
```

`ExpService.grant(tx, userId, amount, type, referenceId)`:

1. `INSERT` into `ExpTransaction` (use `createMany({ skipDuplicates: true })` or catch unique violation).
2. Only if a row was actually inserted: `User.totalExp += amount` (use atomic `increment`).
3. Return the amount actually granted (0 if duplicate).

Because of `UNIQUE(userId, type, referenceId)`, double-clicks and concurrent requests cannot double-reward.

## 8.5 Level

Example seed:

```text
Level 1 = 0 EXP,  Level 2 = 100,  Level 3 = 250,  Level 4 = 500,  Level 5 = 1000
```

`GET /api/levels` returns all levels. Dashboard computes current level, next level, and progress percentage from `totalExp`.

## 8.6 Missions

Progress rules (only the first occurrence of each distinct thing counts):

```text
COMPLETE_LESSON → +1 for each lesson completed for the first time
COMPLETE_QUIZ   → +1 for each quiz submitted for the first time
PASS_QUIZ       → +1 for each quiz passed for the first time
COLLECT_CARD    → +1 for each newly obtained card
```

* Only `ACTIVE` missions progress. `UserMission` is created lazily on the first relevant event after the mission is active. Progress counts from that moment.
* When `progress >= target`: set `completed = true`, `completedAt` (progress is capped at `target`).
* **Claim**: `POST /api/missions/:id/claim` requires `completed = true` and `claimedAt IS NULL`. In one transaction: set `claimedAt`, grant `rewardExp` (`MISSION_COMPLETION`, referenceId = missionId), grant `rewardCardId` if any (`UserCard`, skip if owned), then run the pipeline. A second claim returns `MISSION_ALREADY_CLAIMED`.

## 8.7 Card unlock

| unlockType | Trigger | unlockRefId |
|---|---|---|
| LESSON_COMPLETE | first completion of that lesson | lessonId |
| QUIZ_PASS | first passing attempt of that quiz | quizId |
| LEVEL_REACH | user's level reaches that level | levelId |
| MISSION_REWARD | mission claim (via `Mission.rewardCardId`) | — |

Create `UserCard` with `createMany({ skipDuplicates: true })`. If the user already owns the card, nothing happens. Only `ACTIVE` cards can be unlocked. The response lists only newly unlocked cards.

---

# 9. AI Assistant (P1 basic, P2 extras)

Purpose: a learning helper, **not** the source of curriculum content.

## 9.1 API

One endpoint in MVP:

```http
POST /api/ai/chat
```

```json
{
  "message": "Tại sao nhà Trần thắng quân Mông - Nguyên?",
  "lessonId": "optional",
  "mode": "ASK | EXPLAIN | SUMMARIZE"
}
```

* `mode` defaults to `ASK`. `EXPLAIN` and `SUMMARIZE` require `lessonId`. They reuse the same service with different prompt templates. Separate `/explain` and `/summarize` routes are not created.
* Response:

```json
{
  "success": true,
  "data": {
    "message": "...",
    "context": { "lessonId": "...", "usedLessonContext": true }
  }
}
```

## 9.2 Context building (when `lessonId` is provided)

1. Load the lesson (must be `PUBLISHED`) and related characters, events, periods.
2. Convert `content` HTML to plain text and truncate to a fixed budget (e.g. 6,000 characters). Truncate at a paragraph boundary.
3. Build the prompt: system rules + lesson context (as quoted data) + user question.
4. Lesson content is **data, not instructions** (prompt-injection guard).

## 9.3 Safety and cost control

* API key only on backend; system prompt never exposed.
* Max message length 500 characters. Reject empty messages.
* Rate limit per authenticated user: 10 requests/minute and 50 requests/day (in-memory in MVP).
* Timeout 30 s; on failure return `AI_UNAVAILABLE`. The rest of the app must work without AI.
* System prompt rules: answer in Vietnamese, age-appropriate for the user's grade, prefer lesson context, say clearly when unsure, never invent dates/names, distinguish "explanation" from official curriculum, refuse off-topic requests politely.
* Frontend displays a fixed notice: "AI can be wrong. Please check with your textbook."
* Do not store chat history in MVP.
* Log metadata only (userId, length, latency). Never log message content or keys.

---

# 10. Dashboard

Route `/dashboard`. Single request `GET /api/dashboard` returns:

```text
user info, grade
level (current, next), totalExp, expProgress %
lessons: completed / in progress / total for user's grade
quiz stats: attempts, average percentage, quizzes passed
missions: active with progress, claimable count
collection: owned / total active cards
continue learning: most recent IN_PROGRESS lesson (or null)
recommended lessons: up to 5 published lessons in user's grade, not completed,
                     prioritizing topics of recently completed lessons, then displayOrder
```

`GET /api/users/me/progress` returns detailed progress per lesson (paginated).

---

# 11. API

## 11.1 Conventions

Success:

```json
{ "success": true, "data": {} }
```

Paginated list:

```json
{ "success": true, "data": { "items": [], "page": 1, "pageSize": 20, "total": 0 } }
```

Error:

```json
{ "success": false, "message": "Lesson not found", "errorCode": "LESSON_NOT_FOUND" }
```

* `pageSize` default 20, max 100.
* Status codes: 200, 201, 204, 400 (validation), 401, 403, 404, 409 (conflict), 429, 500.
* Common error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `ACCOUNT_BANNED`, `LESSON_NOT_FOUND`, `QUIZ_NOT_FOUND`, `QUIZ_NOT_PUBLISHED`, `QUIZ_TIME_EXPIRED`, `NO_OPEN_ATTEMPT`, `MISSION_NOT_COMPLETED`, `MISSION_ALREADY_CLAIMED`, `RATE_LIMITED`, `AI_UNAVAILABLE`.
* Swagger is auto-generated from DTOs and is the API reference.

## 11.2 Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

## 11.3 User

```http
GET   /api/users/me
PATCH /api/users/me            # fullName, avatar, gradeId
GET   /api/users/me/progress
GET   /api/users/me/collection
GET   /api/users/me/missions
```

## 11.4 Learning (public read, published only)

```http
GET  /api/education-levels
GET  /api/grades
GET  /api/topics
GET  /api/topics/:id
GET  /api/periods
GET  /api/characters/:slug        # includes related lessons and events (P1)
GET  /api/lessons
GET  /api/lessons/:slug
POST /api/lessons/:id/start       # auth
POST /api/lessons/:id/complete    # auth
GET  /api/search?q=
```

`GET /api/lessons` and `GET /api/lessons/:slug` are readable without login for published lessons (SEO); progress fields are included only when authenticated.

## 11.5 Quiz

```http
GET  /api/quizzes/:id              # metadata only, no questions
POST /api/quizzes/:id/start
POST /api/quizzes/:id/submit
GET  /api/quizzes/:id/history
GET  /api/quiz-attempts/:id        # owner only
```

## 11.6 Gamification and collection

```http
GET  /api/levels
GET  /api/missions
POST /api/missions/:id/claim
GET  /api/exp/history
GET  /api/cards                    # ?type= &rarity=
GET  /api/cards/:id
GET  /api/dashboard
```

## 11.7 AI

```http
POST /api/ai/chat
```

## 11.8 Admin API

All under `/api/admin/*`, guarded by `JwtAuthGuard` + `RolesGuard(ADMIN)`:

```http
/api/admin/users                    GET, GET/:id, PATCH/:id   (status, role only; no create/delete)
/api/admin/topics                   GET, GET/:id, POST, PATCH/:id, DELETE/:id (soft)
/api/admin/periods                  same
/api/admin/characters               same
/api/admin/events                   same
/api/admin/lessons                  same (relations + media in body, see 7.2)
/api/admin/quizzes                  same
/api/admin/quizzes/:id/questions    GET, POST, PATCH/:questionId, DELETE/:questionId
                                    (answers are nested in the question body and replaced together)
/api/admin/missions                 same
/api/admin/cards                    same
/api/admin/dashboard                GET (counts: users, lessons, quizzes, attempts)
/api/admin/uploads/sign             POST (Cloudinary signature) or /uploads (multipart)
```

* `DELETE` = set status `ARCHIVED` / `INACTIVE`. Physical delete only for `DRAFT` items that have no dependents.
* List endpoints support `page`, `pageSize`, `search`, `status`.

---

# 12. Authentication & Security

## 12.1 Authentication (decision changed from v1)

* Login returns nothing sensitive in the body and sets cookie `access_token`: JWT, **httpOnly, Secure (prod), SameSite=Lax, path=/, 7 days**.
* No `localStorage` tokens. No refresh token in MVP.
* Frontend and backend appear same-origin: Next.js `rewrites` proxy `/api/*` to the backend, so the cookie is first-party.
* The backend also accepts `Authorization: Bearer <token>` (for Swagger/tests/tools). Cookie takes precedence.
* `JwtStrategy` loads the user from the DB on every request and rejects `INACTIVE`/`BANNED` users. Role is read from the DB, never from the client.
* Logout clears the cookie.
* CSRF protection for mutating requests (`POST/PATCH/DELETE`): SameSite=Lax, require `Content-Type: application/json` (or multipart for upload), and verify the `Origin` header equals `WEB_ORIGIN`.
* Password: min 8 characters, hashed with Argon2id. Do not return `passwordHash` in any response.
* Login error message is generic (no email enumeration). Same for forgot-password: always respond success.
* Reset password: random 32-byte token, only its SHA-256 hash is stored, expires in 30 minutes, single use, invalidates after use.

## 12.2 Authorization

* `JwtAuthGuard` (global, with `@Public()` decorator for public routes).
* `RolesGuard` with `@Roles('ADMIN')` for admin routes.
* Ownership checks: users can only read their own attempts, progress, collection.
* Frontend route protection is only UX. Backend is the authority.

## 12.3 Security checklist

```text
Argon2 password hashing            Request validation with Zod DTOs (whitelist, reject unknown fields)
helmet security headers            CORS restricted to WEB_ORIGIN
Global rate limit                  Stricter limits on auth, forgot-password, AI
HTML sanitize on save + on render  No secrets in frontend, no secrets in logs
Proper HTTP status codes           Prisma queries only (no string-built SQL; $queryRaw with parameters)
Upload validation (type, size)     Health check endpoint GET /health
```

Rate limits (in-memory):

```text
Global:            100 requests/min/IP
/auth/login, /register:    10/min/IP
/auth/forgot-password:     3/hour per IP and per email
/ai/chat:                  10/min and 50/day per user
```

## 12.4 Privacy (users include minors)

* Collect only email, full name, avatar, grade.
* No public profiles, no user-to-user content, no leaderboard showing full names in MVP.
* Do not send personal data to the AI provider (send only the question and lesson context).

## 12.5 Never trust the client for

```text
role, quiz score, EXP amount, level, mission completion, card ownership, lesson completion rewards
```

---

# 13. Frontend

## 13.1 Routes

**Public**

```text
/  /login  /register  /forgot-password  /reset-password
/learning/lessons/:slug        (public read; actions require login)
```

**User**

```text
/dashboard
/learning                      # ONE page with filter bar: grade, topic, period, difficulty, search
/learning/topics/:slug         # optional shortcut, same list with topicId preset
/learning/characters/:slug     # P1
/quiz/:id                      # take quiz
/quiz/:id/result?attemptId=
/missions
/collection
/collection/:id
/progress
/ai
/profile
/onboarding/grade              # shown once after first login if gradeId is null
```

**Admin** (10 screens, all built from the generic CRUD component)

```text
/admin
/admin/users
/admin/topics
/admin/periods
/admin/lessons        # includes relations + media + link to its quiz
/admin/characters
/admin/events
/admin/quizzes        # includes question and answer editor
/admin/missions
/admin/cards
```

## 13.2 Generic admin CRUD (mandatory)

Build ONE reusable set in `components/admin-crud/`: `DataTable` (TanStack Table, server pagination/search/status filter), `EntityForm` (React Hook Form + Zod, config-driven fields), `ConfirmDialog`, `StatusBadge`, `RelationSelect` (multi-select for grades/topics/etc.), `RichTextEditor` (Tiptap), `ImageUploader`. Each admin page is a small config file (columns + fields + endpoints). Writing a custom table/form per entity is not allowed unless the generic one cannot express it.

## 13.3 UI states

Every data-driven screen must handle: **Loading (skeleton), Success, Empty, Error (with retry), Unauthorized (redirect to login), Forbidden, Not Found.**

## 13.4 UI requirements

* Mobile-first, responsive down to 360 px width. Readable typography for students (base font ≥ 16 px).
* After lesson complete / quiz submit: show earned EXP, level-up, and unlocked cards (reward feedback is part of the core loop; keep it simple: dialog/toast, no heavy animation in MVP).
* Data fetching via TanStack Query; invalidate `dashboard`, `progress`, `missions`, `collection` after reward-producing actions.
* Forms validated with the shared Zod schemas from `packages/shared`.
* Display lesson HTML only after DOMPurify.

---

# 14. Seed Data

Seed must run with one command (`pnpm db:seed`) and be idempotent (upsert by slug/code).

| Entity | Fixed / Minimum (needed for full demo) | Target if time allows |
|---|---|---|
| Education Levels | 3 | 3 |
| Grades | 9 (Grade 4–12) | 9 |
| Levels | 5 | 5 |
| Topics | 8 | 10+ |
| Historical Periods | 8 | 10+ |
| Lessons (published) | 12, covering at least 4 grades, with lesson-topic-period relations | 20+ |
| Characters | 12 | 20+ |
| Events | 12 | 20+ |
| History Cards | 15 (mix of unlockTypes and rarities) | 20+ |
| Quizzes | 6 | 10+ |
| Questions | 30 (mix of all 3 types) | 50+ |
| Missions | 6 (one per type, plus variants) | 10+ |
| Accounts | 1 admin, 2 demo users (`admin@…`, `user@…`, documented in README) | |

Content rules:

* Historical content must be checked against the official textbook before it is marked `PUBLISHED`. AI-drafted text is allowed only as a first draft.
* Add a short note in `README` about sources used.
* Writing seed content is a recurring task: about 3–4 lessons with quizzes per week from week 3.

---

# 15. Testing & Definition of Done

## 15.1 Required backend tests (must exist before week 8 ends)

```text
Auth:        register duplicate email, login wrong password, banned user rejected, admin route with USER role → 403
Lesson:      complete twice → EXP granted only once
Quiz:        scoring for each question type, all-or-nothing multiple choice, client-sent score ignored,
             correct answers hidden before submit, time limit
Rewards:     first pass grants QUIZ_PASS once; repeat attempts grant 0
             concurrent complete requests (Promise.all) → exactly one ExpTransaction
             mission progress counts distinct first-time events only
             mission claim twice → 409, reward granted once
             card unlock twice → one UserCard
             level derived correctly at boundaries (99, 100, 249, 250 EXP)
Search:      "tran hung dao" finds "Trần Hưng Đạo"
```

## 15.2 Frontend and E2E

* Vitest: forms and loading/empty/error states of the main lists.
* Playwright: the MVP flow in section 17 (user flow and admin flow), run against seeded data.

## 15.3 Definition of Done (per feature)

```text
[ ] Prisma schema + migration (if needed)
[ ] Backend API with DTO validation, authorization, error codes
[ ] Frontend UI with loading / empty / error states
[ ] Reused existing components/services (no duplicated logic)
[ ] Type check, lint pass (no `any` without documented reason)
[ ] Tests for business rules (section 15.1) where applicable
[ ] Swagger updated
[ ] Verified manually against seeded data
[ ] SPEC updated if behavior or schema changed
```

CI (GitHub Actions) runs: install, type check, lint, test, `prisma migrate deploy` on a test DB.

---

# 16. Roadmap (9 weeks)

| Week | Dev A (backend) | Dev B (frontend) | Exit criteria |
|---|---|---|---|
| 1 | Repo, Docker, **full Prisma schema**, migration, seed skeleton (levels, grades), CI, Swagger, error/response format | Next.js, Tailwind, shadcn, layout, API client, query setup, auth pages skeleton | Schema reviewed by both; CI green. **Schema is frozen after this week except via SPEC update** |
| 2 | Auth, cookie JWT, guards, users/me, grade selection, throttling, helmet. **First deploy** | Login/register/onboarding/profile, route protection, generic admin layout | Register → login → select grade works on deployed URL |
| 3 | Admin CRUD: topics, periods, characters, events | `admin-crud` generic components + those 4 pages | Admin can manage taxonomy. Start seed content |
| 4 | Lesson admin API (relations, media, sanitize, publish validation), public lesson list with composable filters | Tiptap editor, media/relations UI, lessons admin page, `/learning` list with filters | Admin creates lesson; user filters by grade+topic |
| 5 | Lesson detail, start/complete, progress, Vietnamese search (unaccent/pg_trgm) | Lesson page, complete button, search UI, `/progress`, character page | Lesson flow complete; search works with/without accents |
| 6 | Quiz admin API, start/submit/scoring, history, result payload | Quiz editor (questions/answers), quiz taking UI, result page | Full quiz flow with server-side scoring. Tests for scoring |
| 7 | **RewardService**, EXP, level, missions + claim, card unlock, dashboard API, transaction/idempotency tests | Dashboard, missions, collection, reward feedback UI, admin missions/cards pages | Core loop works end-to-end |
| 8 | AI chat (+ modes), forgot/reset password + mailer, rate limits, remaining tests | AI page (+ lesson entry points), forgot/reset pages, E2E (Playwright) | MVP acceptance flow (section 17) passes |
| 9 | Security review, bug fixes, seed completion, README, production check | Loading/empty/error polish, responsive pass, seed content review, demo prep | **No new features.** Demo-ready |

Weekly rule: at the end of each week, both developers demo the deployed build to each other. If a week slips by more than 2 days, apply the cut order (section 16.1) immediately instead of extending the schedule.

## 16.1 Cut order if behind schedule

1. Anything P2.
2. `EXPLAIN` / `SUMMARIZE` modes (keep `ASK`).
3. Character detail page.
4. Search for Topic and Character (keep Lesson search).
5. Forgot/reset password + mailer.
6. Level-based and mission-reward card unlock (keep `LESSON_COMPLETE` and `QUIZ_PASS`).

**Never cut**: auth, lesson, progress, quiz, EXP, missions, cards (the core loop).

---

# 17. MVP Acceptance Criteria

User flow:

```text
Register → Login → Select Grade → Dashboard → Browse/Filter Lessons → Open Lesson
→ Complete Lesson (+20 EXP) → Take Quiz → Submit (score + EXP)
→ Mission progress → Unlock History Card → View Collection → Claim Mission
→ Ask AI about the lesson
```

Admin flow:

```text
Admin Login → Admin Dashboard → Create/Edit Lesson (with relations, media)
→ Create Quiz + Questions + Answers → Create History Card → Create Mission
→ Publish → User can immediately see the published content
```

Non-functional:

```text
- Repeating any reward action never grants a second reward
- A USER token cannot access any /api/admin/* route
- No correct answer is exposed before quiz submission
- No secret or API key appears in frontend bundle or logs
- Works on 360 px mobile width and desktop
- Deployed and reachable on public URLs; seed data loaded
```

---

# 18. Vibe Coding Rules (for AI coding agents)

1. Read `SPEC.md` before implementing a feature. Implement only what the current phase/week requires.
2. Do not invent new entities when an existing one can represent the requirement.
3. Do not change the database schema or behavior without updating `SPEC.md` and adding a changelog line.
4. Business logic belongs to the backend. Rewards go only through `RewardService`.
5. The frontend must never determine: score, EXP, level, card ownership, mission completion, user role.
6. Each feature includes (when applicable): database, backend API, frontend UI, validation, error handling, loading state, authorization.
7. Do not implement P2 or out-of-scope features unless explicitly requested.
8. Reuse existing components/services (especially the generic admin CRUD and shared Zod schemas).
9. TypeScript strict. Avoid `any` unless there is a documented reason. Types/enums shared through `packages/shared`.
10. Never build SQL by string concatenation. Use Prisma; for `$queryRaw` use parameters.
11. Any code that grants something once (EXP, card, mission reward) must be idempotent and covered by a test.
12. After each feature: type check → lint → tests → migration check → API check (Swagger) → UI check → fix errors before moving on.

---

# Appendix A — Changelog (v1 → v2)

| # | Change | Reason |
|---|---|---|
| 1 | Added constraints (2 devs, 9 weeks), scope, out-of-scope list, cut order, weekly roadmap | Realistic delivery plan |
| 2 | Priorities re-balanced: EXP/Level/Mission/Card/AI/Dashboard moved to weeks 7–8 as P1; AI is single endpoint | v1 P0/P1/P2 did not match the phases |
| 3 | Final stack fixed (shadcn, TanStack Table, Tiptap, nestjs-zod, Cloudinary, pnpm workspaces, `packages/shared`) | Faster delivery, shared types |
| 4 | Repo layout: `frontend`, `backend` (same names as v1), plus `packages/shared`; modules merged (`gamification`, `search`, `dashboard`) | Less boilerplate |
| 5 | Auth: JWT in httpOnly cookie (7 days), Next.js `/api` proxy, Origin/CSRF checks; Bearer still accepted | Avoid `localStorage` token theft via XSS; refresh tokens dropped for simplicity |
| 6 | Added `PasswordResetToken` entity | v1 required secure reset token but had no storage |
| 7 | `HistoryCard.historicalPeriod` (string) → `periodId` FK; added `unlockType`, `unlockRefId` | v1 described unlock logic but had no data to drive it |
| 8 | `UserMission.claimedAt` added; claim flow defined (complete ≠ claimed) | v1 had both "complete mission" EXP and a claim API without a defined relation |
| 9 | `ExpTransaction` gets `UNIQUE(userId, type, referenceId)` | Database-level idempotency against double rewards and race conditions |
| 10 | Defined exactly when EXP is granted for quizzes (first submit / first pass), attempts unlimited | v1 was ambiguous and allowed EXP farming |
| 11 | Added `RewardService` pipeline (EXP → missions → cards → level) in one transaction | Single place for reward logic |
| 12 | `QuizAttempt.passed` added; attempt created at `start`, scored at `submit`; correct answers hidden until submit; time limit enforced by backend | v1 rules implied this but did not model it |
| 13 | Quiz `passScore` defined as percentage; `Quiz.lessonId` UNIQUE in MVP; publish validation rules | Removes ambiguity |
| 14 | Lesson gets `displayOrder`; publish validation; media rules (image upload, video embed) | Ordering + practical media handling |
| 15 | AI: `/explain` and `/summarize` merged into `/chat` via `mode`; context budget, limits, no history stored | Less code, controlled cost |
| 16 | Admin screens reduced from 14 to 10: Education Level/Grade/Level are seed-managed; Media inside Lesson; Questions/Answers inside Quiz | Time budget |
| 17 | Admin API moved under `/api/admin/*`; generic CRUD component made mandatory | Clear separation, speed |
| 18 | Frontend routes: `/learning/grades|topics|periods` merged into one filterable `/learning`; added `/onboarding/grade` | Simpler UX, fewer pages |
| 19 | Search scope reduced to Lesson/Topic/Character with accent-insensitive requirement | Feasible in MVP |
| 20 | Added pagination format, error codes list, rate-limit numbers, privacy rules for minors | Missing details in v1 |
| 21 | Seed data split into "minimum for demo" and "target" | Content writing is a major time cost |
| 22 | Added required test list and Definition of Done | Bugs in reward logic are hard to see manually |
