import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminQuizzesController } from './admin-quizzes.controller';
import { QuizzesService } from './quizzes.service';
import { PublishStatus, QuestionType } from '@history-learning/shared';

describe('AdminQuizzesController', () => {
  let controller: AdminQuizzesController;
  let service: QuizzesService;

  beforeEach(() => {
    service = {
      adminFindAll: vi.fn(),
      adminFindOne: vi.fn(),
      adminCreate: vi.fn(),
      adminUpdate: vi.fn(),
      adminDelete: vi.fn(),
      adminSetQuestions: vi.fn(),
    } as any;
    controller = new AdminQuizzesController(service);
  });

  it('findAll parses query and calls service.adminFindAll', async () => {
    const mockRes = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 };
    vi.mocked(service.adminFindAll).mockResolvedValue(mockRes as any);

    const result = await controller.findAll({ page: '2', pageSize: '10', search: 'demo', status: 'PUBLISHED' });

    expect(service.adminFindAll).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      search: 'demo',
      status: 'PUBLISHED',
    });
    expect(result).toBe(mockRes);
  });

  it('findOne calls service.adminFindOne', async () => {
    const mockQuiz = { id: 'q-1', title: 'Quiz 1' };
    vi.mocked(service.adminFindOne).mockResolvedValue(mockQuiz as any);

    const result = await controller.findOne({ id: 'q-1' });

    expect(service.adminFindOne).toHaveBeenCalledWith('q-1');
    expect(result).toBe(mockQuiz);
  });

  it('create calls service.adminCreate', async () => {
    const dto = { lessonId: 'l-1', title: 'Quiz Title', status: PublishStatus.DRAFT, passScore: 60 };
    const mockCreated = { id: 'q-1', ...dto };
    vi.mocked(service.adminCreate).mockResolvedValue(mockCreated as any);

    const result = await controller.create(dto);

    expect(service.adminCreate).toHaveBeenCalledWith(dto);
    expect(result).toBe(mockCreated);
  });

  it('update calls service.adminUpdate', async () => {
    const dto = { title: 'New Title' };
    const mockUpdated = { id: 'q-1', title: 'New Title' };
    vi.mocked(service.adminUpdate).mockResolvedValue(mockUpdated as any);

    const result = await controller.update({ id: 'q-1' }, dto);

    expect(service.adminUpdate).toHaveBeenCalledWith('q-1', dto);
    expect(result).toBe(mockUpdated);
  });

  it('remove calls service.adminDelete', async () => {
    vi.mocked(service.adminDelete).mockResolvedValue(undefined);

    await controller.remove({ id: 'q-1' });

    expect(service.adminDelete).toHaveBeenCalledWith('q-1');
  });

  it('setQuestions calls service.adminSetQuestions', async () => {
    const questions = [
      {
        content: 'Question 1',
        type: QuestionType.SINGLE_CHOICE,
        points: 1,
        explanation: null,
        displayOrder: 0,
        answers: [
          { content: 'A', isCorrect: true, displayOrder: 0 },
          { content: 'B', isCorrect: false, displayOrder: 1 },
        ],
      },
    ];
    const mockResult = { id: 'q-1', questions };
    vi.mocked(service.adminSetQuestions).mockResolvedValue(mockResult as any);

    const result = await controller.setQuestions({ id: 'q-1' }, { questions });

    expect(service.adminSetQuestions).toHaveBeenCalledWith('q-1', questions);
    expect(result).toBe(mockResult);
  });
});
