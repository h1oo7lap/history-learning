// Constants shared between frontend and backend (limits, defaults)
// Backend-only business constants live in apps/api/src/common/config/constants.ts

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const CONTENT = {
  LESSON_TITLE_MIN: 5,
  LESSON_TITLE_MAX: 200,
  LESSON_SUMMARY_MAX: 500,
  LESSON_CONTENT_MAX_BYTES: 200 * 1024, // 200 KB
  ESTIMATED_TIME_MIN: 1,
  ESTIMATED_TIME_MAX: 180,
  MEDIA_PER_LESSON_MAX: 20,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024, // 5 MB
} as const;

export const AUTH = {
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 100,
} as const;

export const QUIZ = {
  PASS_SCORE_DEFAULT: 60,
  PASS_SCORE_MIN: 0,
  PASS_SCORE_MAX: 100,
  ANSWERS_MIN: 2,
  ANSWERS_MAX: 6,
  QUESTIONS_MIN: 1,
  QUESTIONS_MAX: 50,
  TIME_LIMIT_GRACE_SECONDS: 10,
} as const;

export const AI = {
  MAX_MESSAGE_LENGTH: 500,
  MIN_MESSAGE_LENGTH: 1,
} as const;

export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS_PER_GROUP: 5,
  DEBOUNCE_MS: 300,
} as const;
