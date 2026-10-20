import { describe, it, expect } from 'vitest';
import {
  normalizeVietnamese,
  tokenizeAndFilter,
  extractBigrams,
  retrieveContext,
  LessonDoc,
} from './retrieval';
import { ErrorCodes } from '../common/errors/error-codes';

describe('AI Retrieval Module', () => {
  const mockLessons: LessonDoc[] = [
    {
      id: 'lesson-bach-dang',
      title: 'Chiến thắng Bạch Đằng năm 938 – Chấm dứt nghìn năm Bắc thuộc',
      slug: 'chien-thang-bach-dang-nam-938',
      status: 'PUBLISHED',
      content: `Vào mùa thu năm 938, chúa Nam Hán sai con trai là Hoằng Tháo chỉ huy thủy quân tiến sang xâm lược nước ta theo đường biển và sông Bạch Đằng.
Ngô Quyền đã dùng kế sách cọc ngầm cắm cọc gỗ vót nhọn bịt sắt xuống lòng sông Bạch Đằng hiểm yếu.
Khi thủy triều bắt đầu rút mạnh, Ngô Quyền hạ lệnh dốc toàn bộ quân lực tổng phản công. Quân giặc bất ngờ tháo chạy, thuyền chiến va phải bãi cọc nhọn bị thủng và đắm vô số. Hoằng Tháo bị tiêu diệt tại trận.`,
    },
    {
      id: 'lesson-doi-do',
      title: 'Lý Thái Tổ và Chiếu dời đô về Thăng Long (1010)',
      slug: 'ly-thai-to-va-chieu-doi-do-thang-long',
      status: 'PUBLISHED',
      content: `Năm 1010, vua Lý Thái Tổ ban Chiếu dời đô từ Hoa Lư về thành Đại La.
Khi đoàn thuyền rồng của vua vừa cập bến dưới chân thành Đại La, có điềm lành rồng vàng bay lên, vua bèn đổi tên Đại La thành thủ đô Thăng Long.
Do có địa thế trung tâm trời đất, thuận lợi sông núi, đất nước thanh bình cần mở mang kinh tế lâu dài.`,
    },
  ];

  const allLessonsForLookup: LessonDoc[] = [
    ...mockLessons,
    {
      id: 'lesson-draft',
      title: 'Kháng chiến chống quân Mông Cổ',
      slug: 'khang-chien-chong-mong-co',
      status: 'DRAFT',
      content: 'Bản thảo chưa hoàn thiện...',
    },
  ];

  // 1. normalize (đ→d, bỏ dấu, giữ số)
  describe('normalizeVietnamese', () => {
    it('normalizes đ/Đ to d, removes diacritics, and preserves numbers', () => {
      expect(normalizeVietnamese('Bạch Đằng năm 938')).toBe('bach dang nam 938');
      expect(normalizeVietnamese('Đô thị cổ Thăng Long Canh Tuất 1010')).toBe(
        'do thi co thang long canh tuat 1010',
      );
      expect(normalizeVietnamese('Đoàn thuyền rồng')).toBe('doan thuyen rong');
    });
  });

  // 2. tokenize bỏ stopword trên dạng còn dấu
  describe('tokenizeAndFilter', () => {
    it('filters stopwords on accented form before stripping diacritics', () => {
      const tokens = tokenizeAndFilter('Lý do vì sao dời đô?');
      // "do", "vì", "sao" are filtered as stopwords
      // "lý", "dời", "đô" are kept and normalized
      expect(tokens).toEqual(['ly', 'doi', 'do']);
    });

    // 3. câu chỉ toàn stopword → []
    it('returns empty array when query consists only of stopwords', () => {
      expect(tokenizeAndFilter('Là gì vậy ạ?')).toEqual([]);
      expect(tokenizeAndFilter('Thì ra là như thế')).toEqual([]);
      expect(tokenizeAndFilter('Có phải thế không?')).toEqual([]);
    });
  });

  // 4. câu trong phạm vi tìm đúng bài
  describe('In-scope Retrieval', () => {
    it('retrieves correct lesson for in-scope question about Bạch Đằng', () => {
      const result = retrieveContext(
        'Trận Bạch Đằng diễn ra năm nào và do ai chỉ huy?',
        mockLessons,
      );
      expect(result.accepted).toBe(true);
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources[0]?.lessonId).toBe('lesson-bach-dang');
      expect(result.contextText).toContain('Bạch Đằng');
    });

    it('retrieves correct lesson for in-scope question about Dời đô', () => {
      const result = retrieveContext(
        'Vua Lý Thái Tổ dời đô từ Hoa Lư về đâu năm 1010?',
        mockLessons,
      );
      expect(result.accepted).toBe(true);
      expect(result.sources[0]?.lessonId).toBe('lesson-doi-do');
      expect(result.contextText).toContain('Chiếu dời đô');
    });
  });

  // 5. cụm 2 từ cộng điểm
  describe('Bigram Bonus Scoring', () => {
    it('gives bonus score for 2-word phrase match (extractBigrams)', () => {
      const tokens = ['bach', 'dang', 'nam', '938'];
      const bigrams = extractBigrams(tokens);
      expect(bigrams).toEqual(['bach dang', 'dang nam', 'nam 938']);

      const result = retrieveContext('thủy quân Bạch Đằng', mockLessons);
      expect(result.accepted).toBe(true);
      // Segment with "Bạch Đằng" bigram gets higher score
      expect(result.segments[0]?.score).toBeGreaterThan(3);
    });
  });

  // 6. gõ không dấu "bach dang nam 938" khớp bài Bạch Đằng
  describe('Unaccented Search', () => {
    it('matches Bạch Đằng lesson when typing unaccented "bach dang nam 938"', () => {
      const result = retrieveContext('bach dang nam 938', mockLessons);
      expect(result.accepted).toBe(true);
      expect(result.sources[0]?.lessonId).toBe('lesson-bach-dang');
      expect(result.sources[0]?.title).toContain('Bạch Đằng');
    });
  });

  // 7. từ khóa trùng sau khi bỏ dấu ("đô" vs "do") không gây khớp sai
  describe('Homophone diacritic safety ("đô" vs "do")', () => {
    it('does not cause false match between stopword "do" and keyword "đô"', () => {
      // In mockLessons, "lesson-doi-do" has "Do có địa thế trung tâm trời đất..."
      // Here "do" is a stopword and must not match "đô" in queries.
      // Query about cause ("Lý do vì sao") should not match "Chiếu dời đô"
      const result = retrieveContext('Lý do vì sao như vậy?', mockLessons);
      // "do", "vì", "sao", "như", "vậy" are stopwords; only "ly" remains (1 token < 2 keywords)
      expect(result.accepted).toBe(false);
      expect(result.sources).toEqual([]);
    });
  });

  // 8. "Thủ đô của Pháp là gì?" bị từ chối kể cả khi dữ liệu mẫu có đoạn "thủ đô Thăng Long"
  describe('I2 Rejection Threshold: "Thủ đô của Pháp là gì?"', () => {
    it('rejects "Thủ đô của Pháp là gì?" even when sample data contains "thủ đô Thăng Long"', () => {
      const result = retrieveContext('Thủ đô của Pháp là gì?', mockLessons);
      expect(result.accepted).toBe(false);
      expect(result.segments).toEqual([]);
      expect(result.sources).toEqual([]);
    });
  });

  // 9. câu nối tiếp ghép câu trước tìm đúng bài
  describe('Follow-up Question Stitching', () => {
    it('stitches previous user question for follow-up and finds correct lesson', () => {
      const history = [
        { role: 'user' as const, content: 'Chiến thắng Bạch Đằng năm 938' },
        {
          role: 'model' as const,
          content: 'Năm 938, Ngô Quyền lãnh đạo quân dân đánh tan quân Nam Hán.',
        },
      ];
      // "Ai chỉ huy?" is a short follow-up query with <= 2 keywords
      const result = retrieveContext('Ai chỉ huy?', mockLessons, { history });
      expect(result.accepted).toBe(true);
      expect(result.sources[0]?.lessonId).toBe('lesson-bach-dang');
    });

    it('stitches when question contains demonstrative pronoun', () => {
      const history = [
        { role: 'user' as const, content: 'Vua Lý Thái Tổ ban Chiếu dời đô' },
        {
          role: 'model' as const,
          content: 'Năm 1010, vua Lý Thái Tổ quyết định dời đô từ Hoa Lư về Thăng Long.',
        },
      ];
      const result = retrieveContext('Ý nghĩa của sự kiện này là gì?', mockLessons, { history });
      expect(result.accepted).toBe(true);
      expect(result.sources[0]?.lessonId).toBe('lesson-doi-do');
    });

    // 10. sau câu về Bạch Đằng thì "Thủ đô của Pháp là gì?" vẫn bị từ chối
    it('does NOT stitch unrelated question after Bạch Đằng question, and still rejects it', () => {
      const history = [
        { role: 'user' as const, content: 'Chiến thắng Bạch Đằng năm 938' },
        {
          role: 'model' as const,
          content: 'Năm 938, Ngô Quyền lãnh đạo quân dân đánh tan quân Nam Hán.',
        },
      ];
      // "Thủ đô của Pháp là gì?" has > 2 keywords, > 3 words, no demonstrative pronoun
      const result = retrieveContext('Thủ đô của Pháp là gì?', mockLessons, { history });
      expect(result.accepted).toBe(false);
      expect(result.sources).toEqual([]);
    });
  });

  // 11. với lessonId: chỉ xét đúng bài đó (kể cả khi bài khác khớp hơn)
  describe('Scoped Search with lessonId', () => {
    it('only considers specified lessonId even if another lesson matches better', () => {
      // Query about Bạch Đằng, but scoped to lesson-doi-do
      const result = retrieveContext(
        'Chiến thắng Bạch Đằng do Ngô Quyền lãnh đạo năm 938',
        mockLessons,
        { lessonId: 'lesson-doi-do' },
      );
      // In lesson-doi-do, there are no mentions of Bạch Đằng, Ngô Quyền
      expect(result.accepted).toBe(false);
      expect(result.sources).toEqual([]);
    });

    it('returns matched source restricted to lessonId when it matches', () => {
      const result = retrieveContext(
        'Lý Thái Tổ dời đô từ Hoa Lư về Thăng Long',
        mockLessons,
        { lessonId: 'lesson-doi-do' },
      );
      expect(result.accepted).toBe(true);
      expect(result.sources.length).toBe(1);
      expect(result.sources[0]?.lessonId).toBe('lesson-doi-do');
    });

    // 12. lessonId của bài chưa xuất bản hoặc không tồn tại → 404
    it('throws 404 LESSON_NOT_FOUND if lessonId does not exist', () => {
      expect(() =>
        retrieveContext('Bạch Đằng', mockLessons, {
          lessonId: 'non-existent-id',
          allLessonsForValidation: allLessonsForLookup,
        }),
      ).toThrowError(
        expect.objectContaining({
          status: 404,
          code: ErrorCodes.LESSON_NOT_FOUND,
        }),
      );
    });

    it('throws 404 LESSON_NOT_PUBLISHED if lessonId exists but is not published', () => {
      expect(() =>
        retrieveContext('Kháng chiến Mông Cổ', mockLessons, {
          lessonId: 'lesson-draft',
          allLessonsForValidation: allLessonsForLookup,
        }),
      ).toThrowError(
        expect.objectContaining({
          status: 404,
          code: ErrorCodes.LESSON_NOT_PUBLISHED,
        }),
      );
    });
  });
});
