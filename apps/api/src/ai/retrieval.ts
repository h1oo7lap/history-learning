import { HttpStatus } from '@nestjs/common';
import type { ContentJsonDto } from '@history-learning/shared';
import { blocksToPlainText, htmlToText, truncateAtParagraph } from '../common/utils/html';
import { AI } from '../common/config/constants';
import { AppError } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';

// =============================================================================
// Interfaces
// =============================================================================

export interface LessonDoc {
  id: string;
  title: string;
  slug: string;
  contentJson?: ContentJsonDto | any;
  content?: string;
  status?: string;
}

export interface HistoryMessage {
  role: 'user' | 'model';
  content: string;
}

export interface RetrievedSegment {
  lessonId: string;
  title: string;
  slug: string;
  content: string;
  score: number;
}

export interface RetrievalResult {
  accepted: boolean;
  contextText: string;
  segments: RetrievedSegment[];
  sources: Array<{ lessonId: string; title: string; slug: string }>;
  debug?: {
    effectiveQuery: string;
    queryTokens: string[];
    topScore: number;
    matchedKeywords: number;
    matchedRatio: number;
    hasBigram: boolean;
  };
}

// =============================================================================
// Vietnamese Stopwords (lowercase, retaining diacritics)
// "do" (because/by) is a stopword; "đô" (capital/dời đô) is NOT.
// =============================================================================

export const VIETNAMESE_STOPWORDS = new Set([
  // Hỏi đáp / nghi vấn
  'gì', 'nào', 'sao', 'đâu', 'mấy', 'ai', 'sao',
  // Quan hệ từ / giới từ
  'của', 'và', 'hoặc', 'hay', 'nhưng', 'mà', 'thì', 'là', 'ở', 'tại', 'trong',
  'trên', 'dưới', 'với', 'bởi', 'do', 'vì', 'nên', 'cho', 'về', 'từ', 'đến',
  'qua', 'ra', 'vào', 'lại', 'lên', 'xuống',
  // Trợ từ / tình thái từ / cảm thán
  'ạ', 'dạ', 'vâng', 'thưa', 'nhé', 'nhỉ', 'chứ', 'hả', 'hử', 'thôi', 'vậy',
  'thế', 'quá', 'lắm', 'rất',
  // Phó từ thời gian / thể
  'đã', 'đang', 'sẽ', 'vừa', 'mới', 'từng', 'xong',
  // Động từ phụ trợ
  'được', 'bị', 'phải', 'có', 'cần', 'muốn', 'hãy', 'xin', 'giúp', 'biết',
  // Chỉ định / lượng từ
  'những', 'các', 'mỗi', 'mọi', 'này', 'đó', 'ấy', 'kia', 'đây', 'đấy',
  'như', 'không', 'chưa', 'chẳng',
]);

const DEMONSTRATIVE_REGEX = /\b(này|đó|ấy|kia|nọ|đây|đấy|ông|bà|ông ấy|bà ấy|họ|người này|người đó|trận này|trận đó|sự kiện này|sự kiện đó|vị này|vị vua này|vị tướng này)\b/i;

// =============================================================================
// Normalization & Tokenization Helpers
// =============================================================================

/**
 * Remove Vietnamese diacritics (đ/Đ -> d, strip combining marks), lowercase, keep numbers.
 */
export function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase();
}

/**
 * Split text into lowercase tokens (retaining diacritics), keeping letters & numbers.
 */
export function tokenizeRaw(text: string): string[] {
  const cleaned = text.replace(/[^\p{L}\p{N}]/gu, ' ');
  return cleaned
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Filter stopwords on accented lowercase tokens FIRST, then remove diacritics.
 * Returns distinct normalized tokens.
 */
export function tokenizeAndFilter(text: string): string[] {
  const rawTokens = tokenizeRaw(text);
  const withoutStopwords = rawTokens.filter((t) => !VIETNAMESE_STOPWORDS.has(t));
  const normalized = withoutStopwords.map(normalizeVietnamese);
  // Keep unique order-preserved tokens
  return Array.from(new Set(normalized));
}

/**
 * Extract 2-token consecutive word pairs (bigrams) from normalized tokens.
 */
export function extractBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return Array.from(new Set(bigrams));
}

/**
 * Determine effective query for follow-up questions.
 * Only stitch previous USER question when:
 * 1) Current question is short (<= 3 words), OR
 * 2) Has <= 2 distinctive keywords, OR
 * 3) Contains a demonstrative pronoun (đại từ chỉ định).
 * Otherwise, search with current question only.
 */
export function resolveEffectiveQuery(
  question: string,
  history?: HistoryMessage[],
): string {
  if (!history || history.length === 0) {
    return question;
  }

  // Find the last USER message (do NOT use AI message)
  const prevUserMessage = history
    .slice()
    .reverse()
    .find((m) => m.role === 'user')?.content?.trim();

  if (!prevUserMessage) {
    return question;
  }

  const words = question.trim().split(/\s+/).filter(Boolean);
  const filteredKeywords = tokenizeAndFilter(question);

  const isShort = words.length <= 3;
  const isFewKeywords = filteredKeywords.length <= 2;
  const hasDemonstrative = DEMONSTRATIVE_REGEX.test(question);

  if (isShort || isFewKeywords || hasDemonstrative) {
    return `${prevUserMessage} ${question}`;
  }

  return question;
}

/**
 * Extract plain text content from a LessonDoc.
 * Prioritizes contentJson (blocksToPlainText), falls back to content (htmlToText).
 */
export function getLessonPlainText(lesson: LessonDoc): string {
  if (lesson.contentJson) {
    const text = blocksToPlainText(lesson.contentJson);
    if (text && text.trim().length > 0) {
      return text.trim();
    }
  }
  if (lesson.content) {
    return htmlToText(lesson.content);
  }
  return '';
}

/**
 * Split text into paragraph-like segments of ~300 characters.
 */
export function chunkTextIntoSegments(text: string, targetLen = 300): string[] {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const segments: string[] = [];

  for (const p of paragraphs) {
    if (p.length <= targetLen * 1.6) {
      segments.push(p);
    } else {
      // Split large paragraph by sentences
      const sentences = p.split(/(?<=[.?!])\s+/);
      let currentChunk = '';
      for (const s of sentences) {
        if (!currentChunk) {
          currentChunk = s;
        } else if (currentChunk.length + s.length + 1 <= targetLen * 1.6) {
          currentChunk += ' ' + s;
        } else {
          segments.push(currentChunk.trim());
          currentChunk = s;
        }
      }
      if (currentChunk.trim()) {
        segments.push(currentChunk.trim());
      }
    }
  }

  return segments;
}

// =============================================================================
// Retrieval Core Function
// =============================================================================

export interface RetrievalOptions {
  lessonId?: string;
  history?: HistoryMessage[];
  allLessonsForValidation?: LessonDoc[];
}

/**
 * Pure retrieval function for History Learning Chatbot.
 * Adheres to rule I1 (sources match used lessons) & I2 (out of scope rejection).
 */
export function retrieveContext(
  question: string,
  publishedLessons: LessonDoc[],
  options?: RetrievalOptions,
): RetrievalResult {
  // 1. Validate lessonId if specified
  if (options?.lessonId) {
    const targetId = options.lessonId;
    if (options.allLessonsForValidation) {
      const foundInAll = options.allLessonsForValidation.find((l) => l.id === targetId);
      if (!foundInAll) {
        throw new AppError(ErrorCodes.LESSON_NOT_FOUND, HttpStatus.NOT_FOUND, 'Bài học không tồn tại');
      }
      if (foundInAll.status && foundInAll.status !== 'PUBLISHED') {
        throw new AppError(ErrorCodes.LESSON_NOT_PUBLISHED, HttpStatus.NOT_FOUND, 'Bài học chưa xuất bản');
      }
    } else {
      const foundInPublished = publishedLessons.find((l) => l.id === targetId);
      if (!foundInPublished) {
        throw new AppError(ErrorCodes.LESSON_NOT_FOUND, HttpStatus.NOT_FOUND, 'Bài học không tồn tại hoặc chưa xuất bản');
      }
    }
  }

  // 2. Resolve effective query (handling follow-ups)
  const effectiveQuery = resolveEffectiveQuery(question, options?.history);

  // 3. Tokenize query (stopword filtering on accented tokens first, then normalize)
  const queryTokens = tokenizeAndFilter(effectiveQuery);
  if (queryTokens.length === 0) {
    return {
      accepted: false,
      contextText: '',
      segments: [],
      sources: [],
      debug: {
        effectiveQuery,
        queryTokens: [],
        topScore: 0,
        matchedKeywords: 0,
        matchedRatio: 0,
        hasBigram: false,
      },
    };
  }

  const queryBigrams = extractBigrams(queryTokens);
  const queryTokensSet = new Set(queryTokens);
  const queryBigramsSet = new Set(queryBigrams);

  // 4. Filter candidate lessons by lessonId if provided
  const candidateLessons = options?.lessonId
    ? publishedLessons.filter((l) => l.id === options.lessonId)
    : publishedLessons;

  // 5. Score segments across candidate lessons
  const scoredSegments: RetrievedSegment[] = [];
  let bestLessonMatchedTokensCount = 0;
  let bestLessonRatio = 0;
  let bestLessonHasBigram = false;
  let bestLessonScore = 0;

  for (const lesson of candidateLessons) {
    // Lesson title tokens & bigrams
    const titleTokens = tokenizeAndFilter(lesson.title);
    const titleBigrams = extractBigrams(titleTokens);
    const titleTokensSet = new Set(titleTokens);
    const titleBigramsSet = new Set(titleBigrams);

    const matchedTitleTokens = new Set<string>();
    for (const token of queryTokensSet) {
      if (titleTokensSet.has(token)) {
        matchedTitleTokens.add(token);
      }
    }

    const matchedTitleBigrams = new Set<string>();
    for (const bg of queryBigramsSet) {
      if (titleBigramsSet.has(bg)) {
        matchedTitleBigrams.add(bg);
      }
    }

    const plainText = getLessonPlainText(lesson);
    const segments = chunkTextIntoSegments(plainText);

    // Keep track of all distinct query tokens matched anywhere in this lesson
    const lessonMatchedTokens = new Set<string>(matchedTitleTokens);
    let lessonHasBigram = matchedTitleBigrams.size > 0;
    let maxSegmentScoreInLesson = 0;

    for (const segmentContent of segments) {
      const segTokens = tokenizeAndFilter(segmentContent);
      const segBigrams = extractBigrams(segTokens);
      const segTokensSet = new Set(segTokens);
      const segBigramsSet = new Set(segBigrams);

      const matchedContentTokens = new Set<string>();
      for (const token of queryTokensSet) {
        if (segTokensSet.has(token)) {
          matchedContentTokens.add(token);
          lessonMatchedTokens.add(token);
        }
      }

      const matchedContentBigrams = new Set<string>();
      for (const bg of queryBigramsSet) {
        if (segBigramsSet.has(bg)) {
          matchedContentBigrams.add(bg);
          lessonHasBigram = true;
        }
      }

      // Exact matching scores:
      // content token: 1.0, content bigram: 2.0
      // title token: 2.5, title bigram: 4.0
      const score =
        matchedContentTokens.size * 1.0 +
        matchedContentBigrams.size * 2.0 +
        matchedTitleTokens.size * 2.5 +
        matchedTitleBigrams.size * 4.0;

      if (score > maxSegmentScoreInLesson) {
        maxSegmentScoreInLesson = score;
      }

      // Only consider segment if it contributes relevant content
      if (matchedContentTokens.size > 0 || matchedTitleTokens.size > 0) {
        scoredSegments.push({
          lessonId: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          content: segmentContent,
          score,
        });
      }
    }

    const lessonRatio = lessonMatchedTokens.size / queryTokens.length;
    if (lessonMatchedTokens.size > bestLessonMatchedTokensCount) {
      bestLessonMatchedTokensCount = lessonMatchedTokens.size;
      bestLessonRatio = lessonRatio;
      bestLessonHasBigram = lessonHasBigram;
      bestLessonScore = maxSegmentScoreInLesson;
    }
  }

  // 6. I2 Threshold Evaluation:
  // - For short queries (<= 3 keywords), require strict ratio (>= 0.70, i.e. 100% of 2 or 3 tokens)
  //   to prevent out-of-scope queries like "Thủ đô của Pháp" (2/3 = 66.7%) from matching generic words like "thủ đô".
  // - For longer queries (> 3 keywords, including stitched follow-ups), require >= 2 keywords AND >= 50% ratio.
  const minRatio = queryTokens.length <= 3 ? 0.70 : 0.50;

  const accepted =
    bestLessonMatchedTokensCount >= 2 &&
    bestLessonRatio >= minRatio &&
    bestLessonScore >= 2.5;

  if (!accepted) {
    return {
      accepted: false,
      contextText: '',
      segments: [],
      sources: [],
      debug: {
        effectiveQuery,
        queryTokens,
        topScore: bestLessonScore,
        matchedKeywords: bestLessonMatchedTokensCount,
        matchedRatio: bestLessonRatio,
        hasBigram: bestLessonHasBigram,
      },
    };
  }

  // 7. Sort segments by score descending and take up to 3
  scoredSegments.sort((a, b) => b.score - a.score);
  const topSegments = scoredSegments.slice(0, 3);

  // 8. Format context text & enforce MAX_LESSON_CONTEXT_CHARS
  const formattedContext = topSegments
    .map((s) => `[Bài học: ${s.title}]\n${s.content}`)
    .join('\n\n');

  const contextText = truncateAtParagraph(formattedContext, AI.MAX_LESSON_CONTEXT_CHARS);

  // 9. Extract sources from used segments (Rule I1)
  const sourceMap = new Map<string, { lessonId: string; title: string; slug: string }>();
  for (const seg of topSegments) {
    if (!sourceMap.has(seg.lessonId)) {
      sourceMap.set(seg.lessonId, {
        lessonId: seg.lessonId,
        title: seg.title,
        slug: seg.slug,
      });
    }
  }

  return {
    accepted: true,
    contextText,
    segments: topSegments,
    sources: Array.from(sourceMap.values()),
    debug: {
      effectiveQuery,
      queryTokens,
      topScore: bestLessonScore,
      matchedKeywords: bestLessonMatchedTokensCount,
      matchedRatio: bestLessonRatio,
      hasBigram: bestLessonHasBigram,
    },
  };
}
