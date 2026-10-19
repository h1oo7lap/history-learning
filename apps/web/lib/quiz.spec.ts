import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QuestionType } from '@history-learning/shared';
import {
  calculateRemainingSeconds,
  formatCountdown,
  formatTimeLimit,
  toggleAnswer,
  isAnswerSelected,
  countAnsweredQuestions,
  getDraftStorageKey,
  saveDraftAnswers,
  loadDraftAnswers,
  clearDraftAnswers,
} from './quiz';

describe('quiz utilities', () => {
  describe('calculateRemainingSeconds', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-19T10:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns null if expiresAt is null or undefined', () => {
      expect(calculateRemainingSeconds(null)).toBeNull();
      expect(calculateRemainingSeconds(undefined)).toBeNull();
    });

    it('calculates remaining seconds correctly with zero offset', () => {
      const expiresAt = new Date('2026-10-19T10:15:00.000Z');
      expect(calculateRemainingSeconds(expiresAt, 0)).toBe(900); // 15 mins = 900s
    });

    it('considers positive server offset correctly (server ahead of client)', () => {
      const expiresAt = new Date('2026-10-19T10:15:00.000Z');
      // Server is 60 seconds ahead
      expect(calculateRemainingSeconds(expiresAt, 60_000)).toBe(840);
    });

    it('considers negative server offset correctly (server behind client)', () => {
      const expiresAt = new Date('2026-10-19T10:15:00.000Z');
      // Server is 60 seconds behind
      expect(calculateRemainingSeconds(expiresAt, -60_000)).toBe(960);
    });

    it('clamps to 0 when time has expired', () => {
      const pastTime = new Date('2026-10-19T09:59:00.000Z');
      expect(calculateRemainingSeconds(pastTime, 0)).toBe(0);
    });

    it('handles ISO string format correctly', () => {
      expect(calculateRemainingSeconds('2026-10-19T10:05:00.000Z')).toBe(300);
    });

    it('returns null for invalid date string', () => {
      expect(calculateRemainingSeconds('invalid-date')).toBeNull();
    });
  });

  describe('formatCountdown', () => {
    it('returns "Không giới hạn" for null or undefined', () => {
      expect(formatCountdown(null)).toBe('Không giới hạn');
      expect(formatCountdown(undefined)).toBe('Không giới hạn');
    });

    it('formats seconds into mm:ss', () => {
      expect(formatCountdown(0)).toBe('00:00');
      expect(formatCountdown(5)).toBe('00:05');
      expect(formatCountdown(65)).toBe('01:05');
      expect(formatCountdown(900)).toBe('15:00');
    });

    it('formats hours into hh:mm:ss if >= 3600 seconds', () => {
      expect(formatCountdown(3665)).toBe('1:01:05');
      expect(formatCountdown(7200)).toBe('2:00:00');
    });

    it('clamps negative numbers to 00:00', () => {
      expect(formatCountdown(-10)).toBe('00:00');
    });
  });

  describe('formatTimeLimit', () => {
    it('formats null, undefined or <= 0 as "Không giới hạn"', () => {
      expect(formatTimeLimit(null)).toBe('Không giới hạn');
      expect(formatTimeLimit(undefined)).toBe('Không giới hạn');
      expect(formatTimeLimit(0)).toBe('Không giới hạn');
    });

    it('formats seconds under 1 minute', () => {
      expect(formatTimeLimit(45)).toBe('45 giây');
    });

    it('formats exact minutes', () => {
      expect(formatTimeLimit(900)).toBe('15 phút');
      expect(formatTimeLimit(60)).toBe('1 phút');
    });

    it('formats minutes and seconds', () => {
      expect(formatTimeLimit(95)).toBe('1 phút 35 giây');
    });
  });

  describe('toggleAnswer (Q7)', () => {
    it('replaces choice for SINGLE_CHOICE', () => {
      const res1 = toggleAnswer([], 'ans-1', QuestionType.SINGLE_CHOICE);
      expect(res1).toEqual(['ans-1']);

      const res2 = toggleAnswer(['ans-1'], 'ans-2', QuestionType.SINGLE_CHOICE);
      expect(res2).toEqual(['ans-2']);
    });

    it('replaces choice for TRUE_FALSE', () => {
      const res1 = toggleAnswer(['ans-true'], 'ans-false', QuestionType.TRUE_FALSE);
      expect(res1).toEqual(['ans-false']);
    });

    it('toggles multiple choices for MULTIPLE_CHOICE', () => {
      const res1 = toggleAnswer([], 'ans-1', QuestionType.MULTIPLE_CHOICE);
      expect(res1).toEqual(['ans-1']);

      const res2 = toggleAnswer(['ans-1'], 'ans-2', QuestionType.MULTIPLE_CHOICE);
      expect(res2).toEqual(['ans-1', 'ans-2']);

      const res3 = toggleAnswer(['ans-1', 'ans-2'], 'ans-1', QuestionType.MULTIPLE_CHOICE);
      expect(res3).toEqual(['ans-2']);
    });
  });

  describe('isAnswerSelected', () => {
    it('returns true if answer is in array', () => {
      expect(isAnswerSelected(['a1', 'a2'], 'a1')).toBe(true);
      expect(isAnswerSelected(['a1', 'a2'], 'a3')).toBe(false);
      expect(isAnswerSelected(undefined, 'a1')).toBe(false);
    });
  });

  describe('countAnsweredQuestions (Q8)', () => {
    it('calculates answered, total and unanswered counts accurately', () => {
      const questionIds = ['q1', 'q2', 'q3', 'q4'];
      const answers = {
        q1: ['a1'],
        q2: [],
        q3: ['a2', 'a3'],
      };

      const result = countAnsweredQuestions(questionIds, answers);
      expect(result).toEqual({
        answered: 2,
        total: 4,
        unanswered: 2,
      });
    });

    it('handles empty questions list', () => {
      expect(countAnsweredQuestions([], {})).toEqual({
        answered: 0,
        total: 0,
        unanswered: 0,
      });
    });
  });

  describe('sessionStorage draft answers', () => {
    let storageMock: Record<string, string> = {};

    beforeEach(() => {
      storageMock = {};
      const mockSessionStorage = {
        getItem: (key: string) => storageMock[key] ?? null,
        setItem: (key: string, value: string) => {
          storageMock[key] = String(value);
        },
        removeItem: (key: string) => {
          delete storageMock[key];
        },
        clear: () => {
          storageMock = {};
        },
        get length() {
          return Object.keys(storageMock).length;
        },
        key: (index: number) => Object.keys(storageMock)[index] ?? null,
      };

      vi.stubGlobal('sessionStorage', mockSessionStorage);
      vi.stubGlobal('window', { sessionStorage: mockSessionStorage });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('saves and loads draft answers successfully', () => {
      const attemptId = 'att-123';
      const answers = {
        q1: ['a1'],
        q2: ['a2', 'a3'],
      };

      saveDraftAnswers(attemptId, answers);
      const loaded = loadDraftAnswers(attemptId);
      expect(loaded).toEqual(answers);
    });

    it('filters out invalid questions/answers if validQuestionMap is provided (Adjustment 1)', () => {
      const attemptId = 'att-123';
      const draft = {
        q1: ['a1', 'a-old'], // a-old no longer exists
        q_deleted: ['a-deleted'], // q_deleted no longer exists
        q2: ['a2'],
      };

      saveDraftAnswers(attemptId, draft);

      const validMap = new Map<string, Set<string>>([
        ['q1', new Set(['a1', 'a2'])],
        ['q2', new Set(['a2'])],
      ]);

      const loaded = loadDraftAnswers(attemptId, validMap);
      expect(loaded).toEqual({
        q1: ['a1'],
        q2: ['a2'],
      });
      expect(loaded.q_deleted).toBeUndefined();
    });

    it('clears draft answers successfully', () => {
      const attemptId = 'att-456';
      saveDraftAnswers(attemptId, { q1: ['a1'] });
      expect(loadDraftAnswers(attemptId)).toEqual({ q1: ['a1'] });

      clearDraftAnswers(attemptId);
      expect(loadDraftAnswers(attemptId)).toEqual({});
    });

    it('generates correct storage key format', () => {
      expect(getDraftStorageKey('att-789')).toBe('hl_quiz_draft_att-789');
    });
  });
});
