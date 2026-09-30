// Enums – mirrored from Prisma schema, used by frontend and backend
// Single source of truth: change here AND in schema.prisma

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

export enum ActiveStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum PublishStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export enum ExpType {
  LESSON_COMPLETION = 'LESSON_COMPLETION',
  QUIZ_COMPLETION = 'QUIZ_COMPLETION',
  QUIZ_PASS = 'QUIZ_PASS',
  MISSION_COMPLETION = 'MISSION_COMPLETION',
  OTHER = 'OTHER',
}

export enum MissionType {
  COMPLETE_LESSON = 'COMPLETE_LESSON',
  COMPLETE_QUIZ = 'COMPLETE_QUIZ',
  PASS_QUIZ = 'PASS_QUIZ',
  COLLECT_CARD = 'COLLECT_CARD',
}

export enum CardType {
  CHARACTER = 'CHARACTER',
  EVENT = 'EVENT',
  ARTIFACT = 'ARTIFACT',
  LOCATION = 'LOCATION',
}

export enum CardRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum CardUnlockType {
  NONE = 'NONE',
  LESSON_COMPLETE = 'LESSON_COMPLETE',
  QUIZ_PASS = 'QUIZ_PASS',
  LEVEL_REACH = 'LEVEL_REACH',
  MISSION_REWARD = 'MISSION_REWARD',
}

export enum AiMode {
  ASK = 'ASK',
  EXPLAIN = 'EXPLAIN',
  SUMMARIZE = 'SUMMARIZE',
}
