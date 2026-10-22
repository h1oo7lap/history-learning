import crypto from 'node:crypto';
import { htmlToText } from '../common/utils/html';

export interface LessonChunkInput {
  id: string;
  title: string;
  slug: string;
  contentJson?: any;
  content?: string;
  characters?: Array<any>;
  events?: Array<any>;
}

export interface LessonChunkResult {
  chunkIndex: number;
  heading?: string;
  content: string; // Bản sạch
  embedText: string; // Văn bản đem embed
  contentHash: string; // sha256
}

interface RawSection {
  heading?: string;
  paragraphs: string[];
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extract plain text sections by heading ## from contentJson blocks or html content fallback.
 */
function extractSectionsFromLesson(lesson: LessonChunkInput): RawSection[] {
  const sections: RawSection[] = [];
  let currentHeading: string | undefined;
  let currentParagraphs: string[] = [];

  function commitSection() {
    if (currentParagraphs.length > 0 || currentHeading) {
      const validParagraphs = currentParagraphs.map((p) => p.trim()).filter(Boolean);
      if (validParagraphs.length > 0) {
        sections.push({
          heading: currentHeading,
          paragraphs: validParagraphs,
        });
      }
    }
    currentParagraphs = [];
  }

  // 1. Prefer contentJson text blocks
  if (
    lesson.contentJson &&
    Array.isArray(lesson.contentJson.blocks) &&
    lesson.contentJson.blocks.length > 0
  ) {
    const textBlocks = lesson.contentJson.blocks.filter(
      (b: any) => b && b.type === 'text' && typeof b.text === 'string',
    );

    for (const block of textBlocks) {
      const lines = block.text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Check for Markdown headings ## (or #, ###)
        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
        if (headingMatch && headingMatch[1]) {
          commitSection();
          currentHeading = headingMatch[1].trim();
        } else if (trimmed.length > 0) {
          currentParagraphs.push(trimmed);
        }
      }
      // Commit at end of each block to separate logical sections unless continued
      commitSection();
    }
  } else if (lesson.content) {
    // 2. Fallback to legacy HTML - convert <h1-h6> tags to ## headings
    const withHeadings = lesson.content.replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n## $1\n\n');
    const plain = htmlToText(withHeadings);
    const lines = plain.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
      if (headingMatch && headingMatch[1]) {
        commitSection();
        currentHeading = headingMatch[1].trim();
      } else if (trimmed.length > 0) {
        currentParagraphs.push(trimmed);
      }
    }
    commitSection();
  }

  return sections;
}

/**
 * Merge sections with < 40 words into adjacent sections.
 */
function mergeShortSections(sections: RawSection[]): RawSection[] {
  if (sections.length <= 1) return sections;

  const result: RawSection[] = [];

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]!;
    const wordCount = countWords(sec.paragraphs.join(' '));

    if (wordCount < 40) {
      if (result.length > 0) {
        // Merge into previous section
        const prev = result[result.length - 1]!;
        if (sec.heading && !prev.paragraphs.includes(sec.heading)) {
          prev.paragraphs.push(sec.heading);
        }
        prev.paragraphs.push(...sec.paragraphs);
      } else if (i + 1 < sections.length) {
        // Merge into next section
        const next = sections[i + 1]!;
        if (sec.heading) {
          next.paragraphs.unshift(sec.heading);
        }
        next.paragraphs.unshift(...sec.paragraphs);
      } else {
        // Only section left
        result.push(sec);
      }
    } else {
      result.push(sec);
    }
  }

  return result;
}

/**
 * Split a section with > 250 words into chunks of ~150-200 words with 1 paragraph overlap.
 */
function splitLargeSection(section: RawSection): Array<{ heading?: string; content: string }> {
  const totalWords = countWords(section.paragraphs.join(' '));
  if (totalWords <= 250) {
    return [
      {
        heading: section.heading,
        content: section.paragraphs.join('\n\n'),
      },
    ];
  }

  const chunks: Array<{ heading?: string; content: string }> = [];
  const paragraphs = section.paragraphs;
  let pIndex = 0;

  while (pIndex < paragraphs.length) {
    const chunkParagraphs: string[] = [];
    let currentWords = 0;

    while (pIndex < paragraphs.length) {
      const p = paragraphs[pIndex]!;
      const pWords = countWords(p);

      chunkParagraphs.push(p);
      currentWords += pWords;
      pIndex++;

      // Once chunk reaches target range ~150-200 words (>= 150)
      if (currentWords >= 150) {
        break;
      }
    }

    // Check if remaining paragraphs are very short (< 40 words) -> include them in this chunk
    const remainingParagraphs = paragraphs.slice(pIndex);
    const remainingWords = countWords(remainingParagraphs.join(' '));
    if (remainingWords > 0 && remainingWords < 40) {
      chunkParagraphs.push(...remainingParagraphs);
      pIndex = paragraphs.length;
    }

    chunks.push({
      heading: section.heading,
      content: chunkParagraphs.join('\n\n'),
    });

    // 1-paragraph overlap for next chunk if there are remaining paragraphs
    if (pIndex < paragraphs.length && chunkParagraphs.length > 1) {
      pIndex -= 1; // step back 1 paragraph to overlap
    }
  }

  return chunks;
}

/**
 * Pure TS chunker function:
 * Splits lesson content into chunks by headings, enforces word limits, builds clean content and embedText.
 */
export function chunkLesson(lesson: LessonChunkInput): LessonChunkResult[] {
  const rawSections = extractSectionsFromLesson(lesson);
  const mergedSections = mergeShortSections(rawSections);

  const flatChunks: Array<{ heading?: string; content: string }> = [];
  for (const sec of mergedSections) {
    flatChunks.push(...splitLargeSection(sec));
  }

  // Format metadata header
  const metadataParts: string[] = [`Bài: ${lesson.title}`];

  if (lesson.characters && lesson.characters.length > 0) {
    const charNames = lesson.characters
      .map((c) => (typeof c === 'string' ? c : c.name || c.slug || ''))
      .filter(Boolean);
    if (charNames.length > 0) {
      metadataParts.push(`Nhân vật: ${charNames.join(', ')}`);
    }
  }

  if (lesson.events && lesson.events.length > 0) {
    const eventNames = lesson.events
      .map((e) => (typeof e === 'string' ? e : e.name || e.slug || ''))
      .filter(Boolean);
    if (eventNames.length > 0) {
      metadataParts.push(`Sự kiện: ${eventNames.join(', ')}`);
    }
  }

  const metadataHeader = metadataParts.join(' | ');

  return flatChunks.map((chunk, index) => {
    const headingPrefix = chunk.heading ? `${chunk.heading}\n\n` : '';
    const cleanContent = chunk.content.trim();
    const embedText = `${metadataHeader}\n\n${headingPrefix}${cleanContent}`.trim();
    const contentHash = crypto.createHash('sha256').update(embedText).digest('hex');

    return {
      chunkIndex: index,
      heading: chunk.heading,
      content: cleanContent,
      embedText,
      contentHash,
    };
  });
}
