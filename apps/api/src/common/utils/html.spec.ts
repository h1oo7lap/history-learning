import { describe, it, expect } from 'vitest';
import { blocksToHtml, blocksToPlainText, hasTextContent } from './html';
import type { ContentJsonDto } from '@history-learning/shared';

// =============================================================================
// blocksToHtml
// =============================================================================

describe('blocksToHtml', () => {
  const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

  it('converts a single text block to <p> tags', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: 'Hello world' }],
    };
    expect(blocksToHtml(doc)).toBe('<p>Hello world</p>');
  });

  it('converts multiline text to multiple <p> tags', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: 'Line one\nLine two\nLine three' }],
    };
    expect(blocksToHtml(doc)).toBe('<p>Line one</p><p>Line two</p><p>Line three</p>');
  });

  it('converts **bold** to <strong>', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: 'Hello **world**' }],
    };
    expect(blocksToHtml(doc)).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('converts *italic* to <em>', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: 'Hello *world*' }],
    };
    expect(blocksToHtml(doc)).toBe('<p>Hello <em>world</em></p>');
  });

  it('does not apply em to ** (bold marker)', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: '**bold** and *italic*' }],
    };
    const html = blocksToHtml(doc);
    expect(html).toBe('<p><strong>bold</strong> and <em>italic</em></p>');
  });

  // XSS safety tests
  it('escapes <script> tags in text block', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: '<script>alert(1)</script>' }],
    };
    const html = blocksToHtml(doc);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;/script&gt;');
  });

  it('escapes <img onerror> in text block', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: '<img src=x onerror=alert(1)>' }],
    };
    const html = blocksToHtml(doc);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('escapes & < > " \' characters', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [{ id: 'b1', type: 'text', text: 'A & B < C > D "E" \'F\'' }],
    };
    const html = blocksToHtml(doc);
    expect(html).toContain('&amp;');
    expect(html).toContain('&lt;');
    expect(html).toContain('&gt;');
    expect(html).toContain('&quot;');
    expect(html).toContain('&#39;');
  });

  it('skips image blocks (not included in HTML)', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'image', url: cloudinaryUrl, alt: 'A picture', caption: 'Cap' },
        { id: 'b2', type: 'text', text: 'After image' },
      ],
    };
    const html = blocksToHtml(doc);
    expect(html).not.toContain('A picture');
    expect(html).toContain('After image');
  });

  it('skips audio blocks', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'audio', url: cloudinaryUrl, title: 'My Audio' },
        { id: 'b2', type: 'text', text: 'Text after audio' },
      ],
    };
    const html = blocksToHtml(doc);
    expect(html).not.toContain('My Audio');
    expect(html).toContain('Text after audio');
  });

  it('skips video blocks', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
        { id: 'b2', type: 'text', text: 'Text after video' },
      ],
    };
    const html = blocksToHtml(doc);
    expect(html).not.toContain('dQw4w9WgXcQ');
    expect(html).toContain('Text after video');
  });

  it('returns empty string when no text blocks', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'image', url: cloudinaryUrl, alt: 'img' },
        { id: 'b2', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
      ],
    };
    expect(blocksToHtml(doc)).toBe('');
  });

  it('handles empty blocks array', () => {
    const doc: ContentJsonDto = { version: 1, blocks: [] };
    expect(blocksToHtml(doc)).toBe('');
  });

  it('preserves order of multiple text blocks', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'text', text: 'First' },
        { id: 'b2', type: 'image', url: cloudinaryUrl, alt: 'img' },
        { id: 'b3', type: 'text', text: 'Second' },
      ],
    };
    const html = blocksToHtml(doc);
    expect(html.indexOf('First')).toBeLessThan(html.indexOf('Second'));
  });
});

// =============================================================================
// blocksToPlainText
// =============================================================================

describe('blocksToPlainText', () => {
  it('joins text blocks with double newline', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'text', text: 'First paragraph' },
        { id: 'b2', type: 'text', text: 'Second paragraph' },
      ],
    };
    expect(blocksToPlainText(doc)).toBe('First paragraph\n\nSecond paragraph');
  });

  it('skips non-text blocks', () => {
    const doc: ContentJsonDto = {
      version: 1,
      blocks: [
        { id: 'b1', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
        { id: 'b2', type: 'text', text: 'Only text' },
      ],
    };
    expect(blocksToPlainText(doc)).toBe('Only text');
  });
});

// =============================================================================
// hasTextContent
// =============================================================================

describe('hasTextContent', () => {
  it('returns true when there is a text block', () => {
    expect(
      hasTextContent([{ id: 'b1', type: 'text', text: 'Hello' }]),
    ).toBe(true);
  });

  it('returns false when only image/video/audio blocks', () => {
    expect(
      hasTextContent([
        { id: 'b1', type: 'image', url: 'https://res.cloudinary.com/demo/x.jpg', alt: 'x' },
        { id: 'b2', type: 'video', youtubeId: 'dQw4w9WgXcQ' },
      ]),
    ).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasTextContent([])).toBe(false);
  });
});
