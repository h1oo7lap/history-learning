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

    it('allows updating fullName or avatar without changing gradeId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'USER',
        gradeId: 'grade-4',
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        fullName: 'New Name',
        gradeId: 'grade-4',
      });

      const result = await service.updateProfile('user-1', { fullName: 'New Name' });

      expect(result.fullName).toBe('New Name');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});

