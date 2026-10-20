'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api-client';

// ─── Types ──────────────────────────────────────────────────────

interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

interface ImageUploaderProps {
  /** Current image URL (for preview) */
  value: string;
  /** Called with the new URL when upload completes or URL is set */
  onChange: (url: string) => void;
  /** Folder path in Cloudinary (e.g. "characters", "topics", "lessons/thumbnails") */
  folder?: string;
  /** Max file size in MB (default: 5) */
  maxSizeMb?: number;
  /** Accepted file types */
  accept?: string;
  /** Label text */
  label?: string;
  /** Hint text */
  hint?: string;
  /** Disable the uploader */
  disabled?: boolean;
}

// ─── Component ──────────────────────────────────────────────────

export function ImageUploader({
  value,
  onChange,
  folder = 'uploads',
  maxSizeMb = 5,
  accept = 'image/jpeg,image/png,image/webp',
  label = 'Hình ảnh',
  hint,
  disabled = false,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [isChanging, setIsChanging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate file type
      const allowedTypes = accept.split(',').map((t) => t.trim());
      if (!allowedTypes.some((t) => file.type.match(t.replace('*', '.*')))) {
        setError('Định dạng file không được hỗ trợ. Chấp nhận: JPG, PNG, WebP');
        return;
      }

      // Validate file size
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`File quá lớn. Tối đa ${maxSizeMb}MB`);
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        // 1. Get signed upload params from our API
        const sign = await api.post<CloudinarySignResponse>('media/sign', { folder });

        // 2. Upload directly to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sign.apiKey);
        formData.append('timestamp', String(sign.timestamp));
        formData.append('signature', sign.signature);
        formData.append('folder', sign.folder);

        const xhr = new XMLHttpRequest();
        const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error('Upload thất bại'));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Lỗi mạng khi upload')));
          xhr.open('POST', uploadUrl);
          xhr.send(formData);
        });

        onChange(result.secure_url);
        setIsChanging(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload thất bại';
        setError(msg);
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [accept, maxSizeMb, folder, onChange],
  );

  const handleApplyUrl = () => {
    const val = urlInput.trim();
    if (!val) {
      setError('Vui lòng nhập đường dẫn URL ảnh');
      return;
    }
    if (!val.startsWith('https://') && !val.startsWith('http://')) {
      setError('URL ảnh phải bắt đầu bằng https:// hoặc http://');
      return;
    }
    setError(null);
    onChange(val);
    setIsChanging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) setDragOver(true);
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setError(null);
    setIsChanging(false);
  };

  const showUploader = !value || isChanging;

  return (
    <div>
      {label && (
        <label className="label">
          {label}
          {hint && (
            <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6, fontSize: '0.8rem' }}>
              {hint}
            </span>
          )}
        </label>
      )}

      {/* Preview when value exists and not in change mode */}
      {value && !isChanging && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              maxWidth: 320,
              background: 'var(--surface-2)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Xem trước ảnh"
              style={{
                width: '100%',
                maxHeight: 180,
                objectFit: 'cover',
                display: 'block',
              }}
              onError={() => setError('Không tải được ảnh từ URL này. Vui lòng kiểm tra lại liên kết.')}
            />
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                display: 'flex',
                gap: '0.35rem',
              }}
            >
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                style={{
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✕ Xóa
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: 420 }}>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
              title={value}
            >
              🔗 {value}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setIsChanging(true)}
              disabled={disabled}
              style={{ fontSize: '0.78rem' }}
            >
              📷 Đổi ảnh
            </button>
          </div>
        </div>
      )}

      {/* Mode selection & upload zone / URL input */}
      {showUploader && !uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Mode switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setMode('upload');
                  setError(null);
                }}
                disabled={disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === 'upload' ? '2px solid var(--brand-500)' : '2px solid transparent',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: mode === 'upload' ? 600 : 400,
                  color: mode === 'upload' ? 'var(--brand-500)' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                📤 Tải ảnh lên
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('url');
                  setError(null);
                }}
                disabled={disabled}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: mode === 'url' ? '2px solid var(--brand-500)' : '2px solid transparent',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.82rem',
                  fontWeight: mode === 'url' ? 600 : 400,
                  color: mode === 'url' ? 'var(--brand-500)' : 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                🔗 Nhập link URL
              </button>
            </div>

            {/* Cancel changing if existing value */}
            {value && isChanging && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsChanging(false);
                  setError(null);
                }}
                style={{ fontSize: '0.75rem' }}
              >
                Hủy
              </button>
            )}
          </div>

          {/* Upload mode: Drag & drop */}
          {mode === 'upload' && (
            <div
              onClick={() => !disabled && inputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setDragOver(false)}
              style={{
                border: `2px dashed ${dragOver ? 'var(--brand-500)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                background: dragOver ? 'var(--brand-50)' : 'var(--surface-2)',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem', opacity: 0.6 }}>📷</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                Kéo thả hình ảnh vào đây hoặc{' '}
                <span style={{ color: 'var(--brand-500)', fontWeight: 600 }}>nhấn để chọn từ máy</span>
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                JPG, PNG, WebP · Tối đa {maxSizeMb}MB
              </p>
            </div>
          )}

          {/* URL mode: Direct input */}
          {mode === 'url' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/hinh-anh.jpg hoặc https://res.cloudinary.com/..."
                  value={urlInput}
                  disabled={disabled}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  style={{ flex: 1, fontSize: '0.82rem' }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleApplyUrl}
                  disabled={disabled || !urlInput.trim()}
                  style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                >
                  Áp dụng
                </button>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.72rem', margin: 0 }}>
                Hỗ trợ liên kết ảnh HTTPS trực tiếp hoặc ảnh từ Cloudinary
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'center',
            background: 'var(--surface-2)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 'var(--radius-full)',
              background: 'var(--border)',
              overflow: 'hidden',
              marginBottom: '0.6rem',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--brand-500), var(--brand-400))',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Đang tải lên... {progress}%
          </p>
        </div>
      )}

      {/* Error display */}
      {error && <p className="field-error" style={{ marginTop: '0.5rem' }}>{error}</p>}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
      />
    </div>
  );
}
