import { api } from './api-client';

export interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface UploadImageOptions {
  folder?: string;
  maxSizeMb?: number;
  accept?: string[];
  onProgress?: (percent: number) => void;
}

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.jfif'];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
export const DEFAULT_MAX_SIZE_MB = 5;

/**
 * Validates and uploads an image directly to Cloudinary using a signed signature from the backend.
 */
export async function uploadImage(
  file: File,
  options?: UploadImageOptions,
): Promise<string> {
  const maxSizeMb = options?.maxSizeMb ?? DEFAULT_MAX_SIZE_MB;
  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`File quá lớn. Tối đa ${maxSizeMb}MB`);
  }

  const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  const isTypeMatch = fileType
    ? (options?.accept ?? ALLOWED_IMAGE_TYPES).some((t) => fileType.match(t.replace('*', '.*')))
    : false;
  const isExtMatch = ALLOWED_IMAGE_EXTENSIONS.includes(fileExt);

  if (!isTypeMatch && !isExtMatch) {
    throw new Error('Định dạng file không được hỗ trợ. Chấp nhận: JPG, PNG, WebP, GIF');
  }

  // 1. Get signed upload params from our API
  const sign = await api.post<CloudinarySignResponse>('media/sign', {
    folder: options?.folder ?? 'avatars',
  });

  // 2. Upload directly to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sign.apiKey);
  formData.append('timestamp', String(sign.timestamp));
  formData.append('signature', sign.signature);
  formData.append('folder', sign.folder);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (options?.onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          options.onProgress!(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult;
          resolve(result.secure_url);
        } catch {
          reject(new Error('Phản hồi từ máy chủ ảnh không hợp lệ'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes?.error?.message || `Upload thất bại (${xhr.status})`));
        } catch {
          reject(new Error(`Upload thất bại (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Lỗi mạng khi upload')));
    xhr.open('POST', uploadUrl);
    xhr.send(formData);
  });
}

