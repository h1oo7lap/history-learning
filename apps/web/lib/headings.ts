import type { ContentJsonDto } from '@history-learning/shared';

export interface HeadingItem {
  id: string;
  text: string;
}

export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function extractHeadingsFromContentJson(
  contentJson?: ContentJsonDto | null
): HeadingItem[] {
  if (!contentJson || !Array.isArray(contentJson.blocks)) return [];

  const headings: HeadingItem[] = [];

  for (const block of contentJson.blocks) {
    if (block.type === 'text') {
      const lines = block.text.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('## ')) {
          const text = line.slice(3).trim();
          const id = slugifyText(text) || `heading-${headings.length + 1}`;
          headings.push({ id, text });
        }
      }
    }
  }

  return headings;
}

export function injectHeadingIds(
  html: string
): { processedHtml: string; headings: HeadingItem[] } {
  const headings: HeadingItem[] = [];
  let index = 0;

  const processedHtml = html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, content) => {
    index += 1;
    const cleanText = content.replace(/<[^>]+>/g, '').trim();
    const generatedId = slugifyText(cleanText) || `muc-${index}`;

    // If id attribute already exists in attrs, preserve it
    const idMatch = attrs.match(/id=["']([^"']+)["']/);
    const finalId = idMatch ? idMatch[1] : generatedId;

    headings.push({ id: finalId, text: cleanText });

    if (idMatch) {
      return match;
    }

    return `<h2 id="${finalId}" class="scroll-mt-24"${attrs}>${content}</h2>`;
  });

  return { processedHtml, headings };
}
