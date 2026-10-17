import type { Dispatch, SetStateAction } from 'react';
import { BlockEditor } from '@/components/content/BlockEditor';
import type { ContentBlock } from '@/components/content/BlockEditor';

export interface LessonBasicTabProps {
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  slug: string;
  setSlug: Dispatch<SetStateAction<string>>;
  summary: string;
  setSummary: Dispatch<SetStateAction<string>>;
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  contentMode: 'html' | 'blocks';
  setContentMode: Dispatch<SetStateAction<'html' | 'blocks'>>;
  blocks: ContentBlock[];
  setBlocks: Dispatch<SetStateAction<ContentBlock[]>>;
  thumbnail: string;
  setThumbnail: Dispatch<SetStateAction<string>>;
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function LessonBasicTab({
  title,
  setTitle,
  slug,
  setSlug,
  summary,
  setSummary,
  content,
  setContent,
  contentMode,
  setContentMode,
  blocks,
  setBlocks,
  thumbnail,
  setThumbnail,
  errors,
  clearError,
}: LessonBasicTabProps) {
  return (
    <>
      {/* Title */}
      <div>
        <label className="label" htmlFor="lesson-title">
          Tiêu đề <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <input
          id="lesson-title"
          className={`input${errors.title ? 'error' : ''}`}
          placeholder="Ví dụ: Chiến thắng Bạch Đằng năm 938"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearError('title');
          }}
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      {/* Slug */}
      <div>
        <label className="label" htmlFor="lesson-slug">
          Slug{' '}
          <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.8rem' }}>
            (để trống = tự động)
          </span>
        </label>
        <input
          id="lesson-slug"
          className="input"
          placeholder="chien-thang-bach-dang-938"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </div>

      {/* Summary */}
      <div>
        <label className="label" htmlFor="lesson-summary">
          Tóm tắt
        </label>
        <textarea
          id="lesson-summary"
          className="input"
          rows={2}
          placeholder="Mô tả ngắn gọn nội dung bài học..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          style={{ resize: 'vertical', minHeight: 60 }}
        />
      </div>

      {/* Content */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem',
          }}
        >
          <label className="label" style={{ margin: 0 }}>
            Nội dung <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setContentMode('html')}
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: contentMode === 'html' ? 'var(--brand-500)' : 'var(--surface-2)',
                color: contentMode === 'html' ? '#fff' : 'var(--muted)',
              }}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setContentMode('blocks')}
              style={{
                padding: '0.2rem 0.6rem',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: contentMode === 'blocks' ? 'var(--brand-500)' : 'var(--surface-2)',
                color: contentMode === 'blocks' ? '#fff' : 'var(--muted)',
              }}
            >
              🧱 Block Editor
            </button>
          </div>
        </div>

        {contentMode === 'html' ? (
          <>
            <textarea
              id="lesson-content"
              className={`input${errors.content ? 'error' : ''}`}
              rows={8}
              placeholder="Nội dung bài học (HTML)..."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                clearError('content');
              }}
              style={{
                resize: 'vertical',
                minHeight: 120,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            />
            {errors.content && <p className="field-error">{errors.content}</p>}
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Hỗ trợ HTML (sẽ được sanitize)
            </div>
          </>
        ) : (
          <>
            <BlockEditor
              value={blocks}
              onChange={(b) => {
                setBlocks(b);
                clearError('content');
              }}
            />
            {errors.content && (
              <p
                style={{
                  color: 'var(--error)',
                  fontSize: '0.8rem',
                  marginTop: '0.35rem',
                  fontWeight: 500,
                }}
              >
                ⚠️ {errors.content}
              </p>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.35rem' }}>
              Drag-drop blocks · Upload Cloudinary · YouTube ID tự động trích xuất
            </div>
          </>
        )}
      </div>

      {/* Thumbnail */}
      <div>
        <label className="label" htmlFor="lesson-thumbnail">
          URL Ảnh bìa
        </label>
        <input
          id="lesson-thumbnail"
          className="input"
          type="url"
          placeholder="https://example.com/thumbnail.jpg"
          value={thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
        />
        {thumbnail && (
          <div style={{ marginTop: '0.5rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt="Thumbnail preview"
              style={{
                maxWidth: 160,
                maxHeight: 90,
                borderRadius: 6,
                objectFit: 'cover',
                border: '1px solid var(--border)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
