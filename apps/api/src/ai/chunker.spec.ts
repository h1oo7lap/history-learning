import { describe, it, expect } from 'vitest';
import { chunkLesson, countWords } from './chunker';

describe('Pure TS Chunker (chunkLesson)', () => {
  it('splits sections by ## headings and attaches clean content and embedText', () => {
    const lesson = {
      id: 'lesson-1',
      title: 'Chiến thắng Bạch Đằng',
      slug: 'chien-thang-bach-dang',
      characters: [{ name: 'Ngô Quyền' }],
      events: [{ name: 'Trận Bạch Đằng 938' }],
      contentJson: {
        version: 1,
        blocks: [
          {
            id: 'b1',
            type: 'text',
            text: '## 1. Bối cảnh lịch sử\n\nNăm 938 quân Nam Hán kéo sang xâm lược nước ta theo đường thủy. Ngô Quyền đã chủ động bàn kế đánh giặc với các tướng lĩnh tại vùng cửa sông hiểm yếu nơi thủy triều lên xuống mạnh mẽ mỗi ngày. Toàn dân đồng lòng chuẩn bị cho trận quyết chiến bảo vệ bờ cõi dân tộc.',
          },
          {
            id: 'b2',
            type: 'image',
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          },
          {
            id: 'b3',
            type: 'text',
            text: '## 2. Trận địa cọc ngầm\n\nNgô Quyền cho đẵn gỗ lim vót nhọn đầu bịt sắt rồi cắm chìm dưới lòng sông Bạch Đằng. Khi triều lên bãi cọc bị che khuất hoàn toàn. Thuyền nhẹ ra khiêu chiến nhử thuyền giặc vượt qua bãi cọc vào sâu trong sông khi nước triều đạt đỉnh.',
          },
        ],
      },
    };

    const chunks = chunkLesson(lesson);
    expect(chunks.length).toBe(2);
    expect(chunks[0]!.chunkIndex).toBe(0);
    expect(chunks[0]!.heading).toBe('1. Bối cảnh lịch sử');
    expect(chunks[0]!.content).toContain('Năm 938 quân Nam Hán');
    expect(chunks[0]!.embedText).toContain('Bài: Chiến thắng Bạch Đằng | Nhân vật: Ngô Quyền | Sự kiện: Trận Bạch Đằng 938');
    expect(chunks[0]!.embedText).toContain('1. Bối cảnh lịch sử');
    expect(chunks[0]!.contentHash).toBeDefined();

    expect(chunks[1]!.chunkIndex).toBe(1);
    expect(chunks[1]!.heading).toBe('2. Trận địa cọc ngầm');
  });

  it('merges sections with fewer than 40 words into adjacent section', () => {
    const lesson = {
      id: 'lesson-2',
      title: 'Khởi nghĩa Hai Bà Trưng',
      slug: 'khoi-nghia-hai-ba-trung',
      contentJson: {
        version: 1,
        blocks: [
          {
            id: 'b1',
            type: 'text',
            // Short section with only 10 words (< 40 words)
            text: '## Lời mở đầu\n\nĐất nước ta chìm trong ách đô hộ của nhà Hán tàn bạo.',
          },
          {
            id: 'b2',
            type: 'text',
            // Main section > 40 words
            text: '## Diễn biến cuộc khởi nghĩa\n\nMùa xuân năm 40, Hai Bà Trưng dựng cờ khởi nghĩa ở Hát Môn. Cuộc khởi nghĩa nhanh chóng nhận được sự hưởng ứng nhiệt liệt của nhân dân khắp nơi. Quân khởi nghĩa đánh chiếm Mê Linh, Cổ Loa, Luy Lâu khiến thái thú Tô Định phải cắt tóc cạo râu tháo chạy về nước.',
          },
        ],
      },
    };

    const chunks = chunkLesson(lesson);
    // Short section is merged into adjacent section
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.content).toContain('Lời mở đầu');
    expect(chunks[0]!.content).toContain('Mùa xuân năm 40');
  });

  it('splits sections with more than 250 words into paragraphs of ~150-200 words with 1 paragraph overlap', () => {
    // Generate paragraphs
    const p1 = Array(90).fill('Đoạn_một_tái_hiện_bối_cảnh_lịch_sử_hào_hùng_của_dân_tộc').join(' ');
    const p2 = Array(90).fill('Đoạn_hai_miêu_tả_kế_sách_đánh_giặc_thần_kỳ_và_táo_bạo').join(' ');
    const p3 = Array(90).fill('Đoạn_ba_thuật_lại_diễn_biến_trận_chiến_quyết_liệt_trên_sông').join(' ');
    const p4 = Array(90).fill('Đoạn_bốn_tổng_kết_ý_nghĩa_thắng_lợi_to_lớn_và_bài_học').join(' ');

    const totalWords = countWords(`${p1} ${p2} ${p3} ${p4}`);
    expect(totalWords).toBeGreaterThan(250);

    const lesson = {
      id: 'lesson-3',
      title: 'Đại thắng quân Nguyên Mông',
      slug: 'dai-thang-nguyen-mong',
      contentJson: {
        version: 1,
        blocks: [
          {
            id: 'b1',
            type: 'text',
            text: `## Hào khí Đông A\n\n${p1}\n\n${p2}\n\n${p3}\n\n${p4}`,
          },
        ],
      },
    };

    const chunks = chunkLesson(lesson);
    expect(chunks.length).toBeGreaterThan(1);
    // Check overlap: chunk 1 contains p2, chunk 2 also starts with p2
    expect(chunks[0]!.content).toContain('Đoạn_hai');
    expect(chunks[1]!.content).toContain('Đoạn_hai');
  });

  it('falls back to legacy HTML content when contentJson is absent', () => {
    const lesson = {
      id: 'lesson-legacy',
      title: 'Thời kỳ đồ đá',
      slug: 'thoi-ky-do-da',
      content: '<h2>1. Dấu tích người tối cổ</h2><p>Các nhà khảo cổ học đã tìm thấy dấu tích người tối cổ ở hang Thẩm Khuyên, Thẩm Hai thuộc tỉnh Lạng Sơn với niên đại cách đây hàng chục vạn năm trước công nguyên.</p>',
    };

    const chunks = chunkLesson(lesson);
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.heading).toBe('1. Dấu tích người tối cổ');
    expect(chunks[0]!.content).toContain('Các nhà khảo cổ học');
  });
});
