import sanitizeHtml from 'sanitize-html';
import type { Block, ContentJsonDto } from '@history-learning/shared';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'ul', 'ol', 'li',
  'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  '*': ['class'],
};

/**
 * Sanitize HTML from Tiptap editor for safe server-side storage.
 */
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['https', 'http', 'data'],
  });
}

/**
 * Convert HTML to plain text for AI context building.
 * Strips all tags, decodes entities.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Truncate plain text at a paragraph boundary, respecting a character budget.
 */
export function truncateAtParagraph(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastParagraph = truncated.lastIndexOf('\n\n');
  if (lastParagraph > maxChars * 0.5) {
    return truncated.slice(0, lastParagraph).trim();
  }
  return truncated.trim();
}

// =============================================================================
// Block → HTML / plain-text converters
// =============================================================================

/**
 * Escape special HTML characters to prevent XSS.
 * Used when converting block text to HTML paragraphs.
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Apply inline markdown (** bold **, * italic *) to already-escaped HTML text.
 * Must be called AFTER escapeHtml so that the inline markers themselves
 * are not treated as user-supplied HTML.
 *
 * Supports:
 *   **text** → <strong>text</strong>
 *   *text*   → <em>text</em>   (non-greedy, does not match **)
 */
function applyInlineMarkdown(escaped: string): string {
  return escaped
    // Bold: **...**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *...* (single asterisk, not followed by another *)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
}

/**
 * Convert a single text block's raw text to one or more <p> elements.
 * Each line break becomes a new paragraph.
 * HTML special chars are escaped; **bold** and *italic* markers are converted.
 */
function textBlockToHtml(text: string): string {
  const lines = text.split('\n');
  return lines
    .map((line) => {
      const escaped = escapeHtml(line);
      const inlined = applyInlineMarkdown(escaped);
      return `<p>${inlined}</p>`;
    })
    .join('');
}

/**
 * Convert a ContentJson document to sanitized HTML stored in Lesson.content.
 * Only text blocks contribute to the HTML (image/audio/video are omitted).
 * The resulting HTML is safe to render and searchable by AI/search modules.
 *
 * @param contentJson - validated ContentJsonDto
 * @returns sanitized HTML string (never empty if there is at least one text block)
 */
export function blocksToHtml(contentJson: ContentJsonDto): string {
  const htmlParts: string[] = [];

  for (const block of contentJson.blocks) {
    if (block.type === 'text') {
      htmlParts.push(textBlockToHtml(block.text));
    }
    // image, audio, video blocks are not rendered into HTML content
  }

  // Join all paragraphs; if no text blocks, return empty string
  return htmlParts.join('');
}

/**
 * Convert a ContentJson document to plain text (for AI/search context).
 * Equivalent to calling htmlToText(blocksToHtml(contentJson)) but more direct.
 */
export function blocksToPlainText(contentJson: ContentJsonDto): string {
  const parts: string[] = [];

  for (const block of contentJson.blocks) {
    if (block.type === 'text') {
      parts.push(block.text.trim());
    }
  }

  return parts.join('\n\n');
}

/**
 * Type guard: check if a Block array contains at least one text block with content.
 */
export function hasTextContent(blocks: Block[]): boolean {
  return blocks.some(
    (b) => b.type === 'text' && b.text.trim().length > 0,
  );
}
