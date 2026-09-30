// Single source of truth for backend business constants.
// Frontend limits live in packages/shared/src/constants.ts.

export const EXP = {
  LESSON_COMPLETION: 20,
  QUIZ_COMPLETION: 10,
  QUIZ_PASS: 30,
} as const;

export const REWARD_LOOP_MAX_ITERATIONS = 5;

export const COOKIE_NAME = 'access_token';

export const OPEN_ATTEMPT_TTL_HOURS = 24; // stale open attempts can be replaced

export const AI = {
  MAX_LESSON_CONTEXT_CHARS: 6000,
  MAX_OUTPUT_TOKENS: 800,
} as const;
