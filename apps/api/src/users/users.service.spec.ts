import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service';
import { ErrorCodes } from '../common/errors/error-codes';
import { AppError } from '../common/errors/app-error';

describe('UsersService', () => {
  let service: UsersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      grade: {
        findUnique: vi.fn(),
      },
    };
    service = new UsersService(mockPrisma);
  });

  describe('updateProfile (A4: Grade Lock rules)', () => {
    it('A4: throws 403 GRADE_LOCKED when student with existing gradeId tries to change grade', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        gradeId: 'grade-4',
      });

      await expect(
        service.updateProfile('user-1', { gradeId: 'grade-5' }),
      ).rejects.toMatchObject({
        code: ErrorCodes.GRADE_LOCKED,
        status: 403,
        message: 'Học sinh không thể tự đổi lớp',
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('A4: allows student with null gradeId to select grade for the first time', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        role: 'USER',
        gradeId: null,
      });
      mockPrisma.grade.findUnique.mockResolvedValue({
        id: 'grade-4',
        name: 'Lớp 4',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-new',
        fullName: 'New Student',
        gradeId: 'grade-4',
      });

      const result = await service.updateProfile('user-new', { gradeId: 'grade-4' });

      expect(mockPrisma.grade.findUnique).toHaveBeenCalledWith({ where: { id: 'grade-4' } });
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-new' },
          data: expect.objectContaining({ gradeId: 'grade-4' }),
        }),
      );
      expect(result.gradeId).toBe('grade-4');
    });

    it('A4: allows admin to update their own gradeId even if already set', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        gradeId: 'grade-4',
      });
      mockPrisma.grade.findUnique.mockResolvedValue({
        id: 'grade-5',
        name: 'Lớp 5',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'admin-1',
        gradeId: 'grade-5',
      });

      const result = await service.updateProfile('admin-1', { gradeId: 'grade-5' });

      expect(result.gradeId).toBe('grade-5');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('A4: throws 404 GRADE_NOT_FOUND when non-existent gradeId is provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-new',
        role: 'USER',
        gradeId: null,
      });
      mockPrisma.grade.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-new', { gradeId: 'non-existent' }),
      ).rejects.toThrow(AppError);
    });

    it('throws 403 NAME_LOCKED when student tries to update name', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        gradeId: 'grade-4',
        firstName: 'An',
        lastName: 'Nguyễn',
        fullName: 'Nguyễn An',
      });

      await expect(
        service.updateProfile('user-1', { fullName: 'New Name' }),
      ).rejects.toMatchObject({
        code: ErrorCodes.NAME_LOCKED,
        status: 403,
      });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('allows student to update avatar without changing name or grade', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        gradeId: 'grade-4',
        firstName: 'An',
        lastName: 'Nguyễn',
        fullName: 'Nguyễn An',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        avatar: 'https://example.com/avatar.jpg',
        fullName: 'Nguyễn An',
      });

      const result = await service.updateProfile('user-1', { avatar: 'https://example.com/avatar.jpg' });

      expect(result.avatar).toBe('https://example.com/avatar.jpg');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('allows admin to update their own firstName, lastName and computes Vietnamese fullName', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMIN',
        gradeId: 'grade-4',
        firstName: 'An',
        lastName: 'Nguyễn',
        fullName: 'Nguyễn An',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'admin-1',
        firstName: 'Bình',
        lastName: 'Trần Văn',
        fullName: 'Trần Văn Bình',
        gradeId: 'grade-4',
      });

      const result = await service.updateProfile('admin-1', { firstName: 'Bình', lastName: 'Trần Văn' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Bình',
            lastName: 'Trần Văn',
            fullName: 'Trần Văn Bình',
          }),
        }),
      );
      expect(result.fullName).toBe('Trần Văn Bình');
    });
  });
});

