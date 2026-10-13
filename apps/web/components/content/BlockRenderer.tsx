import type {
  Block,
  TextBlock,
  ImageBlock,
  AudioBlock,
  VideoBlock,
  ContentJsonDto,
} from '@history-learning/shared';

// ─── Inline Markdown parser ─────────────────────────────────────
// Handles **bold** and *italic* only (no external deps).

interface InlineNode {
  type: 'text' | 'bold' | 'italic';
  value: string;
}

function parseInline(raw: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  // Regex: **bold** or *italic*
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
        if (n.type === 'bold') return <strong key={i}>{n.value}</strong>;
        if (n.type === 'italic') return <em key={i}>{n.value}</em>;
        return <span key={i}>{n.value}</span>;
      })}
    </>
  );
}

// ─── Block renderers ────────────────────────────────────────────

function TextBlockRenderer({ block }: { block: TextBlock }) {
  // Split by newlines → each line becomes a <p>
  const lines = block.text.split('\n');
  return (
    <div className="lesson-text-block">
      {lines.map((line, i) => (
        <p key={i} className="lesson-paragraph">
          {line.trim() === '' ? <br /> : <InlineContent text={line} />}
        </p>
      ))}
    </div>
  );
}

function ImageBlockRenderer({ block }: { block: ImageBlock }) {
  return (
    <figure className="lesson-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.url}
        alt={block.alt}
        className="lesson-img"
        loading="lazy"
        decoding="async"
      />
      {block.caption && (
        <figcaption className="lesson-caption">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function AudioBlockRenderer({ block }: { block: AudioBlock }) {
  return (
    <div className="lesson-audio-block">
      {block.title && (
        <p className="lesson-audio-title">
          <span className="lesson-audio-icon" aria-hidden="true">🎵</span>
          {block.title}
        </p>
      )}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls className="lesson-audio" preload="metadata">
        <source src={block.url} />
        Trình duyệt của bạn không hỗ trợ phát âm thanh.
      </audio>
    </div>
  );
}

function VideoBlockRenderer({ block }: { block: VideoBlock }) {
  // YouTube privacy-enhanced embed
  const src = `https://www.youtube-nocookie.com/embed/${block.youtubeId}?rel=0&modestbranding=1`;
  return (
    <div className="lesson-video-block">
      <div className="lesson-video-wrapper">
        <iframe
          src={src}
          title="YouTube video"
          className="lesson-video-iframe"
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

// ─── Main component ─────────────────────────────────────────────

interface BlockRendererProps {
  contentJson: ContentJsonDto;
}

export function BlockRenderer({ contentJson }: BlockRendererProps) {
  return (
    <div className="lesson-content">
      {contentJson.blocks.map((block) => (
        <BlockItem key={block.id} block={block} />
      ))}
    </div>
  );
}

// ─── Fallback: legacy HTML content ─────────────────────────────

interface LegacyContentProps {
  html: string;
}

export function LegacyContent({ html }: LegacyContentProps) {
  return (
    <div
      className="lesson-content lesson-legacy"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
