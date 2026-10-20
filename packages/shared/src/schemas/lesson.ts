import { z } from 'zod';
import { Difficulty, MediaType, PublishStatus } from '../enums';
import { CONTENT } from '../constants';
import { PaginationSchema } from './common';

// =============================================================================
// YouTube ID helper (used by frontend to extract ID from links)
// =============================================================================

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract an 11-character YouTube video ID from various URL formats or a bare ID.
 * Accepts: watch?v=, youtu.be/, /embed/, /shorts/, or a raw 11-char ID.
 * Returns null if the input cannot be parsed to a valid ID.
 */
export function extractYoutubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();

  // Bare 11-char ID
  if (YOUTUBE_ID_RE.test(s)) return s;

  // Try URL parsing
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0] ?? '';
      return YOUTUBE_ID_RE.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      // /shorts/<id>, /embed/<id>, /live/<id>
      const pathParts = url.pathname.split('/').filter(Boolean);
      const segIdx = pathParts.findIndex((p) =>
        ['shorts', 'embed', 'live', 'e', 'v'].includes(p),
      );
      if (segIdx !== -1) {
        const id = pathParts[segIdx + 1] ?? '';
        return YOUTUBE_ID_RE.test(id) ? id : null;
      }
      // ?v= query param
      const v = url.searchParams.get('v') ?? '';
      return YOUTUBE_ID_RE.test(v) ? v : null;
    }
  } catch {
    // not a valid URL, fall through
  }

  return null;
}

// =============================================================================
// Block schemas — the four supported content block types
// =============================================================================

/** Cloudinary URL validation (partial — cloud name checked server-side) */
const cloudinaryUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://'), {
    message: 'URL must use https',
  })
  .refine(
    (u) => {
      try {
        return new URL(u).hostname === 'res.cloudinary.com';
      } catch {
        return false;
      }
    },
    { message: 'URL must be from res.cloudinary.com' },
  );

/** Image URL validation — accepts Cloudinary and external https/http URLs */
const imageUrlSchema = z
  .string()
  .url()
  .refine((u) => u.startsWith('https://') || u.startsWith('http://'), {
    message: 'URL must use https or http',
  });

const blockIdSchema = z.string().min(1).max(64);

export const TextBlockSchema = z.object({
  id: blockIdSchema,
  type: z.literal('text'),
  /** Supports **bold** and *italic* markdown inline syntax; newlines = new paragraph */
  text: z
    .string()
    .min(1, 'text block must not be empty')
    .max(10_000, 'text block exceeds 10,000 characters')
    .refine((t) => t.trim().length > 0, { message: 'text must not be blank' }),
});
export type TextBlock = z.infer<typeof TextBlockSchema>;

export const ImageBlockSchema = z.object({
  id: blockIdSchema,
  type: z.literal('image'),
  url: imageUrlSchema,
  alt: z.string().min(1, 'alt is required').max(300),
  caption: z.string().max(300).optional(),
});
export type ImageBlock = z.infer<typeof ImageBlockSchema>;

export const AudioBlockSchema = z.object({
  id: blockIdSchema,
  type: z.literal('audio'),
  url: cloudinaryUrlSchema,
  title: z.string().max(300).optional(),
});
export type AudioBlock = z.infer<typeof AudioBlockSchema>;

export const VideoBlockSchema = z.object({
  id: blockIdSchema,
  type: z.literal('video'),
  /** 11-character YouTube video ID (NOT a full URL) */
  youtubeId: z
    .string()
    .regex(YOUTUBE_ID_RE, 'youtubeId must be exactly 11 alphanumeric/dash/underscore characters'),
});
export type VideoBlock = z.infer<typeof VideoBlockSchema>;

export const BlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  ImageBlockSchema,
  AudioBlockSchema,
  VideoBlockSchema,
]);
export type Block = z.infer<typeof BlockSchema>;

// =============================================================================
// ContentJson schema
// =============================================================================

export const ContentJsonSchema = z
  .object({
    version: z.literal(1),
    blocks: z
      .array(BlockSchema)
      .max(100, 'contentJson must not exceed 100 blocks'),
  })
  .superRefine((data, ctx) => {
    // Validate unique block IDs
    const ids = data.blocks.map((b) => b.id);
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate block id: "${id}"`,
        });
        return;
      }
      seen.add(id);
    }

    // Validate total JSON byte size (using TextEncoder for browser + Node compat)
    const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
    if (bytes > CONTENT.LESSON_CONTENT_MAX_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `contentJson size (${bytes} bytes) exceeds limit of ${CONTENT.LESSON_CONTENT_MAX_BYTES} bytes`,
      });
    }
  });

export type ContentJsonDto = z.infer<typeof ContentJsonSchema>;

// =============================================================================
// Lesson media (legacy LessonMedia table — kept for file attachments)
// Note: content media (images/audio/video in lesson body) now lives in contentJson
// =============================================================================

export const LessonMediaSchema = z.object({
  type: z.nativeEnum(MediaType),
  url: z.string().url(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  displayOrder: z.number().int().default(0),
});
export type LessonMediaDto = z.infer<typeof LessonMediaSchema>;

export const LessonCharacterRelSchema = z.object({
  characterId: z.string().min(1),
  role: z.string().max(100).optional().nullable(),
});
export type LessonCharacterRelDto = z.infer<typeof LessonCharacterRelSchema>;

// =============================================================================
// CRUD schemas
// =============================================================================

export const CreateLessonSchema = z.object({
  title: z.string().min(CONTENT.LESSON_TITLE_MIN).max(CONTENT.LESSON_TITLE_MAX),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  summary: z.string().max(CONTENT.LESSON_SUMMARY_MAX).optional().nullable(),
  /** Legacy HTML content. Required for backward compat. Ignored by server when contentJson is present. */
  content: z.string(),
  /** Block-based content. When provided, server auto-generates `content` from text blocks. */
  contentJson: ContentJsonSchema.optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.EASY),
  estimatedTime: z
    .number()
    .int()
    .min(CONTENT.ESTIMATED_TIME_MIN)
    .max(CONTENT.ESTIMATED_TIME_MAX)
    .default(10),
  displayOrder: z.number().int().default(0),
  status: z.nativeEnum(PublishStatus).default(PublishStatus.DRAFT),
  // Relations
  gradeIds: z.array(z.string()).default([]),
  topicIds: z.array(z.string()).default([]),
  periodIds: z.array(z.string()).default([]),
  characters: z.array(LessonCharacterRelSchema).default([]),
  eventIds: z.array(z.string()).default([]),
  media: z.array(LessonMediaSchema).default([]),
});
export type CreateLessonDto = z.infer<typeof CreateLessonSchema>;

export const UpdateLessonSchema = CreateLessonSchema.partial();
export type UpdateLessonDto = z.infer<typeof UpdateLessonSchema>;

export const LessonListQuerySchema = PaginationSchema.extend({
  gradeId: z.string().optional(),
  topicId: z.string().optional(),
  periodId: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  search: z.string().optional(),
  status: z.nativeEnum(PublishStatus).optional(),
});
export type LessonListQueryDto = z.infer<typeof LessonListQuerySchema>;
