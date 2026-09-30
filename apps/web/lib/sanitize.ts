import DOMPurify from 'dompurify';

/**
 * Sanitize HTML on the client side before rendering lesson content.
 * Always use this instead of dangerouslySetInnerHTML directly.
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // SSR: return as-is (content was sanitized server-side)
    return html;
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class'],
  });
}
