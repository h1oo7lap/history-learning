import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadImage } from './upload';
import { api } from './api-client';

vi.mock('./api-client', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('uploadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects if file exceeds max size', async () => {
    const file = new File(['a'.repeat(100)], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });

    await expect(uploadImage(file, { maxSizeMb: 5 })).rejects.toThrow(
      'File quá lớn. Tối đa 5MB',
    );
  });

  it('rejects if file format is unsupported', async () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    await expect(uploadImage(file)).rejects.toThrow(
      'Định dạng file không được hỗ trợ',
    );
  });

  it('uploads file successfully to Cloudinary', async () => {
    const mockSign = {
      signature: 'test_signature',
      timestamp: 1234567890,
      cloudName: 'testcloud',
      apiKey: 'test_key',
      folder: 'history-learning/avatars',
    };

    vi.mocked(api.post).mockResolvedValueOnce(mockSign);

    // Mock XMLHttpRequest
    const originalXHR = globalThis.XMLHttpRequest;
    let lastOpenUrl = '';
    let lastOpenMethod = '';

    class MockXHR {
      upload = {
        addEventListener: vi.fn(),
      };
      status = 200;
      responseText = JSON.stringify({
        secure_url: 'https://res.cloudinary.com/testcloud/image/upload/v123/avatar.jpg',
      });
      open = vi.fn((method: string, url: string) => {
        lastOpenMethod = method;
        lastOpenUrl = url;
      });
      send = vi.fn(() => {
        setTimeout(() => {
          this.loadCallback?.();
        }, 0);
      });
      loadCallback: (() => void) | null = null;
      addEventListener = vi.fn((event: string, cb: () => void) => {
        if (event === 'load') this.loadCallback = cb;
      });
    }

    // @ts-expect-error Mocking XHR
    globalThis.XMLHttpRequest = MockXHR;

    try {
      const file = new File(['image-bytes'], 'avatar.png', { type: 'image/png' });
      const onProgress = vi.fn();

      const urlPromise = uploadImage(file, {
        folder: 'avatars',
        onProgress,
      });

      const url = await urlPromise;

      expect(api.post).toHaveBeenCalledWith('media/sign', { folder: 'avatars' });
      expect(lastOpenMethod).toBe('POST');
      expect(lastOpenUrl).toBe(
        'https://api.cloudinary.com/v1_1/testcloud/auto/upload',
      );
      expect(url).toBe('https://res.cloudinary.com/testcloud/image/upload/v123/avatar.jpg');
    } finally {
      globalThis.XMLHttpRequest = originalXHR;
    }
  });

  it('handles upload errors from Cloudinary', async () => {
    const mockSign = {
      signature: 'sig',
      timestamp: 123,
      cloudName: 'testcloud',
      apiKey: 'key',
      folder: 'history-learning/avatars',
    };

    vi.mocked(api.post).mockResolvedValueOnce(mockSign);

    const originalXHR = globalThis.XMLHttpRequest;

    class MockFailedXHR {
      upload = { addEventListener: vi.fn() };
      status = 400;
      responseText = JSON.stringify({ error: { message: 'Upload preset not found' } });
      open = vi.fn();
      send = vi.fn(() => {
        setTimeout(() => {
          this.loadCallback?.();
        }, 0);
      });
      loadCallback: (() => void) | null = null;
      addEventListener = vi.fn((event: string, cb: () => void) => {
        if (event === 'load') this.loadCallback = cb;
      });
    }

    // @ts-expect-error Mocking XHR
    globalThis.XMLHttpRequest = MockFailedXHR;

    try {
      const file = new File(['image-bytes'], 'avatar.jpg', { type: 'image/jpeg' });
      await expect(uploadImage(file)).rejects.toThrow('Upload preset not found');
    } finally {
      globalThis.XMLHttpRequest = originalXHR;
    }
  });
});
