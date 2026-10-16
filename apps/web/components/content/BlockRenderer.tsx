'use client';

import React, { useState } from 'react';
import { Volume2, Video, BookOpen } from 'lucide-react';
import type {
  Block,
  TextBlock,
  ImageBlock,
  AudioBlock,
  VideoBlock,
  ContentJsonDto,
} from '@history-learning/shared';
import { optimizeCloudinaryUrl } from '@/lib/format';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/cn';
import { slugifyText } from '@/lib/headings';
import type { HeadingItem } from '@/lib/headings';

// ─── Inline Markdown parser ─────────────────────────────────────
// Handles **bold** and *italic*

interface InlineNode {
  type: 'text' | 'bold' | 'italic';
  value: string;
}

function parseInline(raw: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(raw)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', value: raw.slice(last, match.index) });
    }
    if (match[0].startsWith('**')) {
      nodes.push({ type: 'bold', value: match[2] });
    } else {
      nodes.push({ type: 'italic', value: match[3] });
    }
    last = match.index + match[0].length;
  }

  if (last < raw.length) {
    nodes.push({ type: 'text', value: raw.slice(last) });
  }

  return nodes;
}

function InlineContent({ text }: { text: string }) {
  const nodes = parseInline(text);
  return (
    <>
      {nodes.map((n, i) => {
        if (n.type === 'bold') return <strong key={i} className="font-bold text-ink">{n.value}</strong>;
        if (n.type === 'italic') return <em key={i} className="italic text-ink-soft">{n.value}</em>;
        return <span key={i}>{n.value}</span>;
      })}
    </>
  );
}

// ─── Text Block Renderer ────────────────────────────────────────

function TextBlockRenderer({ block }: { block: TextBlock }) {
  const rawLines = block.text.split('\n');

  // Group lines into structured tokens (headings, blockquotes, lists, paragraphs)
  type Token =
    | { type: 'h2'; text: string; id: string }
    | { type: 'h3'; text: string; id: string }
    | { type: 'blockquote'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] }
    | { type: 'p'; text: string };

  const tokens: Token[] = [];
  let currentUl: string[] | null = null;
  let currentOl: string[] | null = null;

  const flushLists = () => {
    if (currentUl) {
      tokens.push({ type: 'ul', items: currentUl });
      currentUl = null;
    }
    if (currentOl) {
      tokens.push({ type: 'ol', items: currentOl });
      currentOl = null;
    }
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();

    if (!line) {
      flushLists();
      continue;
    }

    // Heading 2: "## Heading"
    if (line.startsWith('## ')) {
      flushLists();
      const text = line.slice(3).trim();
      const id = slugifyText(text) || `heading-${tokens.length}`;
      tokens.push({ type: 'h2', text, id });
      continue;
    }

    // Heading 3: "### Heading"
    if (line.startsWith('### ')) {
      flushLists();
      const text = line.slice(4).trim();
      const id = slugifyText(text) || `heading-${tokens.length}`;
      tokens.push({ type: 'h3', text, id });
      continue;
    }

    // Blockquote: "> Quote text"
    if (line.startsWith('> ')) {
      flushLists();
      tokens.push({ type: 'blockquote', text: line.slice(2).trim() });
      continue;
    }

    // Unordered list item: "- item" or "* item"
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentOl) flushLists();
      if (!currentUl) currentUl = [];
      currentUl.push(line.slice(2).trim());
      continue;
    }

    // Ordered list item: "1. item"
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (currentUl) flushLists();
      if (!currentOl) currentOl = [];
      currentOl.push(olMatch[1].trim());
      continue;
    }

    // Regular paragraph
    flushLists();
    tokens.push({ type: 'p', text: line });
  }

  flushLists();

  return (
    <div className="font-serif text-[18px] leading-[1.75] text-ink my-2">
      {tokens.map((token, idx) => {
        switch (token.type) {
          case 'h2':
            return (
              <h2
                key={idx}
                id={token.id}
                className="scroll-mt-24 font-serif text-2xl sm:text-[28px] leading-[1.3] font-bold text-ink mt-10 mb-4 pt-5 border-t border-bronze/40"
              >
                {token.text}
              </h2>
            );
          case 'h3':
            return (
              <h3
                key={idx}
                id={token.id}
                className="scroll-mt-24 font-serif text-xl sm:text-2xl leading-[1.35] font-semibold text-ink mt-8 mb-3"
              >
                {token.text}
              </h3>
            );
          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="border-l-4 border-seal pl-4 pr-3 py-2.5 my-6 text-ink-soft italic bg-card/60 rounded-r-md shadow-card"
              >
                <InlineContent text={token.text} />
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={idx} className="list-disc list-outside pl-6 space-y-2 my-5 text-ink">
                {token.items.map((item, i) => (
                  <li key={i} className="pl-1">
                    <InlineContent text={item} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal list-outside pl-6 space-y-2 my-5 text-ink">
                {token.items.map((item, i) => (
                  <li key={i} className="pl-1">
                    <InlineContent text={item} />
                  </li>
                ))}
              </ol>
            );
          case 'p':
            return (
              <p key={idx} className="mb-[1em]">
                <InlineContent text={token.text} />
              </p>
            );
        }
      })}
    </div>
  );
}

// ─── Image Block Renderer ───────────────────────────────────────

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  const [hasError, setHasError] = useState(false);
  const optimizedUrl = optimizeCloudinaryUrl(block.url, 1200);

  return (
    <figure className="my-8 rounded-md overflow-hidden border border-line bg-card shadow-card">
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-paper overflow-hidden">
        {/* Placeholder fallback */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-muted/60 select-none">
          <BookOpen size={36} className="text-muted/50 mb-1.5" aria-hidden="true" />
          <span className="text-xs font-serif text-muted">
            {block.alt || 'Hình ảnh tư liệu'}
          </span>
        </div>

        {!hasError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizedUrl}
            alt={block.alt}
            loading="lazy"
            decoding="async"
            ref={(node) => {
              if (node && node.complete && node.naturalWidth === 0) {
                setHasError(true);
              }
            }}
            onError={() => setHasError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
      {block.caption && (
        <figcaption className="px-4 py-2.5 text-center text-sm text-muted bg-paper/50 border-t border-line font-sans">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── Audio Block Renderer ───────────────────────────────────────

function AudioBlockRenderer({ block }: { block: AudioBlock }) {
  return (
    <div className="my-6 p-4 rounded-md border border-line bg-card shadow-card">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-ink-soft">
        <Volume2 size={18} className="text-seal shrink-0" aria-hidden="true" />
        <span>{block.title || 'Tư liệu âm thanh'}</span>
      </div>
      <audio controls className="w-full mt-2" preload="metadata">
        <source src={block.url} />
        Trình duyệt của bạn không hỗ trợ phát âm thanh.
      </audio>
    </div>
  );
}

// ─── Video Block Renderer ───────────────────────────────────────

function VideoBlockRenderer({ block }: { block: VideoBlock }) {
  const src = `https://www.youtube-nocookie.com/embed/${block.youtubeId}?rel=0&modestbranding=1`;
  return (
    <div className="my-6 p-4 rounded-md border border-line bg-card shadow-card">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-ink-soft">
        <Video size={18} className="text-seal shrink-0" aria-hidden="true" />
        <span>Tư liệu video</span>
      </div>
      <div className="relative aspect-video w-full rounded-md border border-line overflow-hidden bg-ink/5 mt-2">
        <iframe
          src={src}
          title="YouTube video tư liệu lịch sử"
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

// ─── Single block dispatcher ────────────────────────────────────

function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <TextBlockRenderer block={block} />;
    case 'image':
      return <ImageBlockRenderer block={block} />;
    case 'audio':
      return <AudioBlockRenderer block={block} />;
    case 'video':
      return <VideoBlockRenderer block={block} />;
    default:
      return null;
  }
}

// ─── Main BlockRenderer component ───────────────────────────────

export interface BlockRendererProps {
  contentJson: ContentJsonDto;
  className?: string;
}

export function BlockRenderer({ contentJson, className }: BlockRendererProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {contentJson.blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}

// ─── Fallback: Legacy HTML Content (Prose) ──────────────────────

export interface LegacyContentProps {
  html: string;
  className?: string;
}

export function LegacyContent({ html, className }: LegacyContentProps) {
  const sanitizedHtml = sanitizeHtml(html);

  return (
    <div
      className={cn('prose-history font-serif text-[18px] leading-[1.75] text-ink', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} // audit-ignore
    />
  );
}

