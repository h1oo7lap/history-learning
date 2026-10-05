'use client';

import { useState, useRef, useCallback } from 'react';
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
  /** Called with the new URL when upload completes */
  onChange: (url: string) => void;
  /** Folder path in Cloudinary (e.g. "characters", "topics") */
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
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setError(null);
  };

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

      {/* Preview */}
      {value && !uploading && (
        <div style={{
          position: 'relative',
          marginBottom: '0.75rem',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          maxWidth: 240,
        }}>
          <img
            src={value}
            alt="Preview"
            style={{
              width: '100%',
              height: 160,
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            padding: '0.5rem',
          }}>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              style={{
                background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.5rem',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              ✕ Xóa
            </button>
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!value && !uploading && (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? 'var(--brand-500)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            background: dragOver ? 'var(--brand-50)' : 'var(--surface-2)',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>📷</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
            Kéo thả hình ảnh hoặc{' '}
            <span style={{ color: 'var(--brand-500)', fontWeight: 600 }}>nhấn để chọn</span>
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            JPG, PNG, WebP · Tối đa {maxSizeMb}MB
          </p>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          textAlign: 'center',
          background: 'var(--surface-2)',
        }}>
          <div style={{
            width: '100%', height: 6, borderRadius: 'var(--radius-full)',
            background: 'var(--border)', overflow: 'hidden', marginBottom: '0.75rem',
          }}>
            <div style={{
              width: `${progress}%`, height: '100%',
              background: 'linear-gradient(90deg, var(--brand-500), var(--brand-400))',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.2s ease',
            }} />
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
            Đang tải lên... {progress}%
          </p>
        </div>
      )}

      {/* Change button (when has value) */}
      {value && !uploading && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          style={{ marginTop: '0.25rem' }}
        >
          📷 Đổi ảnh
        </button>
      )}

      {/* Error */}
      {error && <p className="field-error" style={{ marginTop: '0.5rem' }}>{error}</p>}

      {/* Hidden input */}
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
