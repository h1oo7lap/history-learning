import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import type { User } from '../generated/prisma/client';

describe('MediaController', () => {
  let controller: MediaController;
  let mediaService: MediaService;

  beforeEach(() => {
    mediaService = {
      signUpload: vi.fn().mockImplementation((folder: string) => ({
        signature: 'mock_sig',
        timestamp: 1234567890,
        cloudName: 'testcloud',
        apiKey: 'testkey',
        folder,
      })),
    } as unknown as MediaService;

    controller = new MediaController(mediaService);
  });

  it('forces folder to history-learning/avatars when user role is USER', () => {
    const studentUser = { id: 'usr-1', role: 'USER' } as User;
    const result = controller.sign(studentUser, { folder: 'characters' });

    expect(mediaService.signUpload).toHaveBeenCalledWith('history-learning/avatars');
    expect(result.folder).toBe('history-learning/avatars');
  });

  it('allows ADMIN to specify custom folder', () => {
    const adminUser = { id: 'admin-1', role: 'ADMIN' } as User;
    const result = controller.sign(adminUser, { folder: 'characters' });

    expect(mediaService.signUpload).toHaveBeenCalledWith('history-learning/characters');
    expect(result.folder).toBe('history-learning/characters');
  });

  it('defaults to history-learning/uploads for ADMIN when folder is omitted', () => {
    const adminUser = { id: 'admin-1', role: 'ADMIN' } as User;
    const result = controller.sign(adminUser);

    expect(mediaService.signUpload).toHaveBeenCalledWith('history-learning/uploads');
    expect(result.folder).toBe('history-learning/uploads');
  });

  it('strips redundant history-learning prefix for ADMIN', () => {
    const adminUser = { id: 'admin-1', role: 'ADMIN' } as User;
    const result = controller.sign(adminUser, { folder: 'history-learning/lessons/thumbnails' });

    expect(mediaService.signUpload).toHaveBeenCalledWith('history-learning/lessons/thumbnails');
    expect(result.folder).toBe('history-learning/lessons/thumbnails');
  });
});

