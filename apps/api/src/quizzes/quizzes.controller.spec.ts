import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizzesController } from './quizzes.controller';
import { QuizzesService } from './quizzes.service';

describe('QuizzesController', () => {
  let controller: QuizzesController;
  let service: QuizzesService;

  beforeEach(() => {
    service = {
      findStudentQuizzes: vi.fn(),
      startQuiz: vi.fn(),
      submitQuiz: vi.fn(),
      getAttemptReview: vi.fn(),
    } as any;
    controller = new QuizzesController(service);
  });

  const mockUser: any = {
    id: 'user-1',
    role: 'USER',
    gradeId: 'grade-1',
  };

  it('findAll delegates to service.findStudentQuizzes', async () => {
    const mockList = [{ id: 'q-1', title: 'Quiz 1' }];
    vi.mocked(service.findStudentQuizzes).mockResolvedValue(mockList as any);

    const result = await controller.findAll(mockUser, { gradeId: 'grade-2' });

    expect(service.findStudentQuizzes).toHaveBeenCalledWith('user-1', 'USER', 'grade-2');
    expect(result).toBe(mockList);
  });

  it('startQuiz delegates to service.startQuiz', async () => {
    const mockRes = { attemptId: 'att-1', questions: [] };
    vi.mocked(service.startQuiz).mockResolvedValue(mockRes as any);

    const result = await controller.startQuiz(mockUser, { id: 'q-1' });

    expect(service.startQuiz).toHaveBeenCalledWith('user-1', 'USER', 'q-1');
    expect(result).toBe(mockRes);
  });

  it('submitQuiz delegates to service.submitQuiz', async () => {
    const dto = { attemptId: 'att-1', answers: [] };
    const mockRes = { attemptId: 'att-1', score: 10, passed: true };
    vi.mocked(service.submitQuiz).mockResolvedValue(mockRes as any);

    const result = await controller.submitQuiz(mockUser, { id: 'q-1' }, dto as any);

    expect(service.submitQuiz).toHaveBeenCalledWith('user-1', 'q-1', dto);
    expect(result).toBe(mockRes);
  });

  it('getAttemptReview delegates to service.getAttemptReview', async () => {
    const mockRes = { attempt: { id: 'att-1' }, questions: [] };
    vi.mocked(service.getAttemptReview).mockResolvedValue(mockRes as any);

    const result = await controller.getAttemptReview(mockUser, { attemptId: 'att-1' });

    expect(service.getAttemptReview).toHaveBeenCalledWith('user-1', 'att-1');
    expect(result).toBe(mockRes);
  });
});
