'use client';

import { useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { extractYoutubeId } from '@history-learning/shared';

// ─── Types ─────────────────────────────────────────────────────────────────

// Types aligned with ContentJsonSchema in packages/shared/src/schemas/lesson.ts
type BlockType = 'text' | 'image' | 'audio' | 'video';

interface TextBlock {
  id: string;
  type: 'text';
  text: string;          // ← must match TextBlockSchema.text
}

interface ImageBlock {
  id: string;
  type: 'image';
  url: string;
  alt: string;           // ← required in ImageBlockSchema
  caption?: string;
}

interface AudioBlock {
  id: string;
  type: 'audio';
  url: string;
  title?: string;
}

interface VideoBlock {
  id: string;
  type: 'video';
  youtubeId: string;     // ← must match VideoBlockSchema.youtubeId
}

export type ContentBlock = TextBlock | ImageBlock | AudioBlock | VideoBlock;

export interface BlockEditorProps {
  /** Current blocks value */
  value: ContentBlock[];
  /** Called whenever blocks change */
  onChange: (blocks: ContentBlock[]) => void;
  /** Cloudinary cloud name for Cloudinary-hosted uploads */
  cloudName?: string;
}

interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

// ─── Helper: generate unique local ID ──────────────────────────────────────

let blockCounter = 0;
function newId(): string {
  return `blk-${Date.now()}-${++blockCounter}`;
}

// ─── Cloudinary uploader hook ───────────────────────────────────────────────

function useCloudinaryUpload(folder: string, accept: string, maxMb = 5) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      const allowedTokens = accept.split(',').map((t) => t.trim().toLowerCase());
      const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
      const fileType = (file.type || '').toLowerCase();

      // Check MIME type or file extension
      const isMimeMatch = fileType ? allowedTokens.some((t) => fileType.match(t.replace('*', '.*'))) : false;
      const isExtMatch = allowedTokens.includes(fileExt);
      const isAudioMatch = accept.includes('audio') && ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'].includes(fileExt);
      const isImageMatch = accept.includes('image') && ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(fileExt);

      if (!isMimeMatch && !isExtMatch && !isAudioMatch && !isImageMatch) {
        setError('Định dạng file không được hỗ trợ');
        return null;
      }
      if (file.size > maxMb * 1024 * 1024) {
        setError(`File quá lớn. Tối đa ${maxMb}MB`);
        return null;
      }
      setError(null);
      setUploading(true);
      setProgress(0);
      try {
        const sign = await api.post<CloudinarySignResponse>('media/sign', { folder });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sign.apiKey);
        formData.append('timestamp', String(sign.timestamp));
        formData.append('signature', sign.signature);
        formData.append('folder', sign.folder);

        // Use auto endpoint so Cloudinary handles image, audio, video automatically
        const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`;
        const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          });
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch {
                reject(new Error('Phản hồi từ máy chủ không hợp lệ'));
              }
            } else {
              try {
                const errData = JSON.parse(xhr.responseText);
                reject(new Error(errData?.error?.message || `Upload thất bại (${xhr.status})`));
              } catch {
                reject(new Error(`Upload thất bại (${xhr.status})`));
              }
            }
          });
          xhr.addEventListener('error', () => reject(new Error('Lỗi mạng khi upload')));
          xhr.open('POST', uploadUrl);
          xhr.send(formData);
        });
        return result.secure_url;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload thất bại');
        return null;
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [accept, maxMb, folder],
  );

  return { upload, uploading, progress, error, setError };
}

// ─── Individual Block Editors ───────────────────────────────────────────────

function TextBlockEditor({
  block,
  onUpdate,
}: {
  block: TextBlock;
  onUpdate: (b: TextBlock) => void;
}) {
  return (
    <div>
      <textarea
        className="input"
        rows={4}
        placeholder="Noi dung van ban. **in dam**, *in nghieng*..."
        value={block.text}
        onChange={(e) => onUpdate({ ...block, text: e.target.value })}
        style={{ resize: 'vertical', minHeight: 90, fontFamily: 'inherit', fontSize: '0.9rem' }}
      />
      <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
        **in dam** · *in nghieng* · xuat hien nhu doan van ban
      </div>
    </div>
  );
}

function ImageBlockEditor({
  block,
  onUpdate,
}: {
  block: ImageBlock;
  onUpdate: (b: ImageBlock) => void;
}) {
  const { upload, uploading, progress, error, setError } = useCloudinaryUpload(
    'lessons/images',
    'image/jpeg,image/png,image/webp',
    5,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) onUpdate({ ...block, url });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Preview */}
      {block.url && !uploading && (
        <div style={{ position: 'relative', maxWidth: 320, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <img src={block.url} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
          <button
            type="button"
            onClick={() => { onUpdate({ ...block, url: '' }); setError(null); }}
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none',
              borderRadius: 4, padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer',
            }}
          >
            Xoa
          </button>
        </div>
      )}

      {/* Drop zone */}
      {!block.url && !uploading && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? 'var(--brand-500)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)', padding: '1rem',
            textAlign: 'center', cursor: 'pointer',
            background: dragOver ? 'var(--brand-50)' : 'var(--surface-2)',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem', opacity: 0.5 }}>🖼️</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>
            Keo tha hoac <span style={{ color: 'var(--brand-500)', fontWeight: 600 }}>chon anh</span>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: '0.2rem 0 0' }}>JPG · PNG · WebP · Max 5MB</p>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--surface-2)' }}>
          <div style={{ width: '100%', height: 4, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', marginBottom: '0.4rem' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--brand-500)', transition: 'width 0.2s' }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>Dang tai len... {progress}%</p>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      {/* Alt / Caption */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label className="label" style={{ fontSize: '0.78rem' }}>Alt text</label>
          <input className="input" placeholder="Mo ta hinh anh..." value={block.alt ?? ''} onChange={(e) => onUpdate({ ...block, alt: e.target.value })} style={{ fontSize: '0.82rem' }} />
        </div>
        <div>
          <label className="label" style={{ fontSize: '0.78rem' }}>Caption</label>
          <input className="input" placeholder="Chu thich anh..." value={block.caption ?? ''} onChange={(e) => onUpdate({ ...block, caption: e.target.value })} style={{ fontSize: '0.82rem' }} />
        </div>
      </div>

      {block.url && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()} style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}>
          📷 Doi anh
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}

function AudioBlockEditor({
  block,
  onUpdate,
}: {
  block: AudioBlock;
  onUpdate: (b: AudioBlock) => void;
}) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(block.url || '');
  const { upload, uploading, progress, error, setError } = useCloudinaryUpload(
    'lessons/audio',
    'audio/mpeg,audio/ogg,audio/wav,audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm',
    20,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const url = await upload(file);
    if (url) {
      setUrlInput(url);
      onUpdate({ ...block, url });
    }
  };

  const handleUrlApply = () => {
    const val = urlInput.trim();
    if (val !== block.url) {
      onUpdate({ ...block, url: val });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div>
        <label className="label" style={{ fontSize: '0.78rem' }}>Tiêu đề âm thanh (tùy chọn)</label>
        <input
          className="input"
          placeholder="Ví dụ: Lời kể của nhân chứng, bản thu âm lịch sử..."
          value={block.title ?? ''}
          onChange={(e) => onUpdate({ ...block, title: e.target.value })}
          style={{ fontSize: '0.82rem' }}
        />
      </div>

      {block.url ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)' }}>🎵 Tệp âm thanh đã chọn:</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setUrlInput('');
                onUpdate({ ...block, url: '' });
                setError(null);
              }}
              style={{ fontSize: '0.75rem', color: '#dc2626' }}
            >
              🗑️ Xóa âm thanh
            </button>
          </div>
          <audio controls src={block.url} style={{ width: '100%', height: 40 }} />
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', wordBreak: 'break-all' }}>
            {block.url}
          </div>
        </div>
      ) : (
        <>
          {/* Mode switch */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setMode('upload')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: mode === 'upload' ? '2px solid var(--brand-500)' : '2px solid transparent',
                padding: '0.2rem 0.5rem',
                fontSize: '0.78rem',
                fontWeight: mode === 'upload' ? 600 : 400,
                color: mode === 'upload' ? 'var(--brand-500)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              📤 Tải lên file
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: mode === 'url' ? '2px solid var(--brand-500)' : '2px solid transparent',
                padding: '0.2rem 0.5rem',
                fontSize: '0.78rem',
                fontWeight: mode === 'url' ? 600 : 400,
                color: mode === 'url' ? 'var(--brand-500)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              🔗 Nhập URL trực tiếp
            </button>
          </div>

          {mode === 'upload' ? (
            uploading ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.75rem', background: 'var(--surface-2)' }}>
                <div style={{ width: '100%', height: 4, borderRadius: 999, background: 'var(--border)', overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--brand-500)', transition: 'width 0.2s' }} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>Đang tải lên... {progress}%</p>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => inputRef.current?.click()}
                  style={{ fontSize: '0.8rem', width: '100%', justifyContent: 'center', border: '1px dashed var(--border)', padding: '0.75rem' }}
                >
                  🎵 Chọn file âm thanh (MP3, WAV, OGG, M4A · Tối đa 20MB)
                </button>
              </div>
            )
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  className="input"
                  placeholder="https://res.cloudinary.com/.../audio.mp3"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onBlur={handleUrlApply}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleUrlApply();
                    }
                  }}
                  style={{ fontSize: '0.82rem', flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleUrlApply}
                  style={{ fontSize: '0.78rem' }}
                >
                  Áp dụng
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                URL Cloudinary hợp lệ bắt đầu bằng https://res.cloudinary.com/...
              </p>
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ padding: '0.5rem', background: 'rgb(239 68 68 / 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgb(239 68 68 / 0.2)' }}>
          <p className="field-error" style={{ margin: 0, fontSize: '0.78rem' }}>⚠️ {error}</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/ogg,audio/wav,audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function VideoBlockEditor({
  block,
  onUpdate,
}: {
  block: VideoBlock;
  onUpdate: (b: VideoBlock) => void;
}) {
  const [input, setInput] = useState(block.youtubeId);
  const [err, setErr] = useState<string | null>(null);

  const handleChange = (val: string) => {
    setInput(val);
    const id = extractYoutubeId(val);
    if (id) {
      setErr(null);
      onUpdate({ ...block, youtubeId: id });
    } else if (val.trim()) {
      setErr('URL YouTube khong hop le. Chap nhan: youtu.be, watch?v=, /shorts/, /embed/');
    } else {
      setErr(null);
      onUpdate({ ...block, youtubeId: '' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div>
        <label className="label" style={{ fontSize: '0.78rem' }}>URL hoac ID YouTube <span style={{ color: 'var(--error)' }}>*</span></label>
        <input
          className={`input${err ? ' error' : ''}`}
          placeholder="https://youtu.be/dQw4w9WgXcQ hoac dQw4w9WgXcQ"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          style={{ fontSize: '0.82rem' }}
        />
        {err && <p className="field-error">{err}</p>}
      </div>

      {block.youtubeId && !err && (
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', aspectRatio: '16/9', maxWidth: 320 }}>
          <img
            src={`https://img.youtube.com/vi/${block.youtubeId}/hqdefault.jpg`}
            alt="YouTube thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {block.youtubeId && !err && (
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>✅ ID: {block.youtubeId}</div>
      )}
    </div>
  );
}

// ─── Block wrapper with controls ────────────────────────────────────────────

const BLOCK_LABELS: Record<BlockType, string> = {
  text: '📝 Van ban',
  image: '🖼️ Hinh anh',
  audio: '🎵 Am thanh',
  video: '▶️ Video YouTube',
};

const BLOCK_COLORS: Record<BlockType, string> = {
  text: '#6366f1',
  image: '#10b981',
  audio: '#f59e0b',
  video: '#ef4444',
};

function BlockWrapper({
  block,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const color = BLOCK_COLORS[block.type];
  return (
    <div
      style={{
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color, flex: 1 }}>
          {BLOCK_LABELS[block.type]}
        </span>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Di chuyen len"
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 4, width: 24, height: 24, cursor: index === 0 ? 'not-allowed' : 'pointer',
              opacity: index === 0 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', color: 'var(--foreground)',
            }}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Di chuyen xuong"
            style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 4, width: 24, height: 24, cursor: index === total - 1 ? 'not-allowed' : 'pointer',
              opacity: index === total - 1 ? 0.35 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', color: 'var(--foreground)',
            }}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Xoa block"
            style={{
              background: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.3)',
              borderRadius: 4, width: 24, height: 24, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', color: '#dc2626',
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: '0.75rem' }}>{children}</div>
    </div>
  );
}

// ─── Main BlockEditor ───────────────────────────────────────────────────────

export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const addBlock = (type: BlockType) => {
    const id = newId();
    let block: ContentBlock;
    if (type === 'text') block = { id, type: 'text', text: '' };
    else if (type === 'image') block = { id, type: 'image', url: '', alt: '', caption: '' };
    else if (type === 'audio') block = { id, type: 'audio', url: '', title: '' };
    else block = { id, type: 'video', youtubeId: '' };
    onChange([...value, block]);
  };

  const updateBlock = (index: number, updated: ContentBlock) => {
    const next = [...value];
    next[index] = updated;
    onChange(next);
  };

  const removeBlock = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = [...value];
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Block list */}
      {value.length === 0 && (
        <div
          style={{
            border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
            padding: '2rem', textAlign: 'center', color: 'var(--muted)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.4 }}>📄</div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Chua co block nao. Them block ben duoi.</p>
        </div>
      )}

      {value.map((block, i) => (
        <BlockWrapper
          key={block.id}
          block={block}
          index={i}
          total={value.length}
          onMove={(dir) => moveBlock(i, dir)}
          onRemove={() => removeBlock(i)}
        >
          {block.type === 'text' && (
            <TextBlockEditor block={block} onUpdate={(b) => updateBlock(i, b)} />
          )}
          {block.type === 'image' && (
            <ImageBlockEditor block={block} onUpdate={(b) => updateBlock(i, b)} />
          )}
          {block.type === 'audio' && (
            <AudioBlockEditor block={block} onUpdate={(b) => updateBlock(i, b)} />
          )}
          {block.type === 'video' && (
            <VideoBlockEditor block={block} onUpdate={(b) => updateBlock(i, b)} />
          )}
        </BlockWrapper>
      ))}

      {/* Add block buttons */}
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          padding: '0.75rem', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border)', background: 'var(--surface-2)',
        }}
      >
        <span style={{ width: '100%', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
          + Them block:
        </span>
        {(['text', 'image', 'audio', 'video'] as BlockType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            style={{
              padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)',
              border: `1px solid ${BLOCK_COLORS[type]}30`,
              background: `${BLOCK_COLORS[type]}10`,
              color: BLOCK_COLORS[type],
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${BLOCK_COLORS[type]}20`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${BLOCK_COLORS[type]}10`; }}
          >
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Stats */}
      {value.length > 0 && (
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {value.length} block • {value.filter((b) => b.type === 'text').length} van ban • {value.filter((b) => b.type === 'image').length} hinh anh • {value.filter((b) => b.type === 'audio').length} am thanh • {value.filter((b) => b.type === 'video').length} video
        </div>
      )}
    </div>
  );
}