import React from 'react';

export interface InlineNode {
  type: 'text' | 'bold' | 'italic';
  value: string;
}

/**
 * Phân tích chuỗi inline hỗ trợ:
 * - **đậm**
 * - *nghiêng*
 * Kết xuất React element an toàn, không chèn HTML thô, an toàn tuyệt đối với ký tự <, >
 */
export function parseInline(raw: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', value: raw.slice(last, match.index) });
    }
    if (match[0].startsWith('**')) {
      nodes.push({ type: 'bold', value: match[2] ?? '' });
    } else {
      nodes.push({ type: 'italic', value: match[3] ?? '' });
    }
    last = match.index + match[0].length;
  }

  if (last < raw.length) {
    nodes.push({ type: 'text', value: raw.slice(last) });
  }

  return nodes;
}

export function InlineContent({ text }: { text: string }) {
  const nodes = parseInline(text);
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'bold') {
          return (
            <strong key={i} className="font-bold text-ink">
              {n.value}
            </strong>
          );
        }
        if (n.type === 'italic') {
          return (
            <em key={i} className="italic text-ink-soft">
              {n.value}
            </em>
          );
        }
        return <span key={i}>{n.value}</span>;
      })}
    </>
  );
}

export type MarkdownBlockToken =
  | { type: 'ul'; items: string[] }
  | { type: 'p'; lines: string[] };

/**
 * Phân tích văn bản markdown thành các khối:
 * - Danh sách gạch đầu dòng: các dòng bắt đầu bằng "- " hoặc "* "
 * - Đoạn văn và xuống dòng: phân tách bằng dòng trống
 */
export function parseMarkdownBlocks(text: string): MarkdownBlockToken[] {
  const rawLines = text.split('\n');
  const tokens: MarkdownBlockToken[] = [];
  let currentUl: string[] | null = null;
  let currentP: string[] | null = null;

  const flushUl = () => {
    if (currentUl && currentUl.length > 0) {
      tokens.push({ type: 'ul', items: currentUl });
      currentUl = null;
    }
  };

  const flushP = () => {
    if (currentP && currentP.length > 0) {
      tokens.push({ type: 'p', lines: currentP });
      currentP = null;
    }
  };

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushUl();
      flushP();
      continue;
    }

    // Mục danh sách: bắt đầu bằng "- " hoặc "* "
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushP();
      if (!currentUl) currentUl = [];
      currentUl.push(trimmed.slice(2).trim());
      continue;
    }

    // Dòng thông thường trong đoạn văn
    flushUl();
    if (!currentP) currentP = [];
    currentP.push(trimmed);
  }

  flushUl();
  flushP();

  return tokens;
}

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
  const tokens = parseMarkdownBlocks(content);

  return (
    <div className={className}>
      {tokens.map((token, idx) => {
        if (token.type === 'ul') {
          return (
            <ul key={idx} className="my-2.5 list-disc pl-5 space-y-1">
              {token.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed">
                  <InlineContent text={item} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="my-2 first:mt-0 last:mb-0 leading-relaxed">
            {token.lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && <br />}
                <InlineContent text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
