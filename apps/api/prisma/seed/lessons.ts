import type { PrismaClient } from '../../src/generated/prisma/client';

export async function seedLessons(prisma: PrismaClient) {
  console.log('  Seeding lessons...');

  // Fetch reference mappings for relational lookups
  const grades = await prisma.grade.findMany();
  const gradeMap = new Map(grades.map((g) => [g.code, g.id]));

  const topics = await prisma.topic.findMany();
  const topicMap = new Map(topics.map((t) => [t.slug, t.id]));

  const periods = await prisma.historicalPeriod.findMany();
  const periodMap = new Map(periods.map((p) => [p.slug, p.id]));

  const characters = await prisma.historicalCharacter.findMany();
  const characterMap = new Map(characters.map((c) => [c.slug, c.id]));

  const events = await prisma.historicalEvent.findMany();
  const eventMap = new Map(events.map((e) => [e.slug, e.id]));

  const lessonsData = [
    // -------------------------------------------------------------------------
    // 1. Trận thủy chiến Bạch Đằng năm 938
    // -------------------------------------------------------------------------
    {
      title: 'Chiến thắng Bạch Đằng năm 938 – Chấm dứt nghìn năm Bắc thuộc',
      slug: 'chien-thang-bach-dang-nam-938',
      summary:
        'Tìm hiểu về trận thủy chiến lẫy lừng trên sông Bạch Đằng do Ngô Quyền lãnh đạo, đánh tan quân Nam Hán và mở ra kỷ nguyên độc lập tự chủ lâu dài cho dân tộc Việt Nam.',
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      difficulty: 'EASY' as const,
      estimatedTime: 12,
      displayOrder: 1,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Bối cảnh lịch sử</h2>
<p>Vào mùa thu năm 938, chúa Nam Hán sai con trai là Vạn vương Hoằng Tháo chỉ huy thủy quân ồ ạt tiến sang xâm lược nước ta theo đường biển và sông Bạch Đằng.</p>
<p>Trước họa xâm lăng, <strong>Ngô Quyền</strong> khẩn trương tập hợp lực lượng toàn dân, định kế đánh giặc tại vùng cửa sông Bạch Đằng hiểm yếu.</p>
<blockquote>"Hoằng Tháo là một đứa trẻ dại, đem quân từ xa đến, quân lính mỏi mệt, lại nghe tin Công Tiễn đã chết, không có người làm nội ứng, khí thế đã mất một nửa rồi. Quân ta lấy sức còn nhàn hạ địch với quân mỏi mệt, tất phá được!" — <em>Ngô Quyền</em></blockquote>
<h2>2. Kế sách cọc ngầm độc đáo</h2>
<p>Ngô Quyền đã lợi dụng hiện tượng <strong>thủy triều lên xuống</strong> của vùng biển Đông Bắc:</p>
<ul>
  <li>Cho đẵn gỗ rừng, vót nhọn đầu và bịt sắt nhọn rồi cắm ngầm xuống lòng sông Bạch Đằng nơi hiểm yếu.</li>
  <li>Khi thủy triều lên, nước ngập che khuất bãi cọc nhọn dưới dòng nước.</li>
  <li>Sai thuyền nhẹ ra khiêu chiến, giả thua rút lui để nhử địch vượt qua bãi cọc khi nước triều đạt đỉnh.</li>
</ul>
<h2>3. Diễn biến trận đánh quyết định</h2>
<p>Khi thủy triều bắt đầu rút mạnh, Ngô Quyền hạ lệnh dốc toàn bộ quân lực tổng phản công. Quân giặc bất ngờ quay đầu tháo chạy, thuyền chiến va phải bãi cọc ngầm nhọn hoắt, bị thủng vỡ và đắm vô số. Quân Nam Hán tan vỡ hoàn toàn, Hoằng Tháo bị tiêu diệt tại trận.</p>
<h2>4. Ý nghĩa lịch sử</h2>
<p>Chiến thắng Bạch Đằng năm 938 có ý nghĩa bước ngoặt vô cùng to lớn: <strong>chính thức chấm dứt hơn 1000 năm Bắc thuộc</strong>, mở ra thời kỳ độc lập tự chủ lâu dài và vẻ vang cho dân tộc ta.</p>`,
      gradeCodes: ['GRADE_4', 'GRADE_7', 'GRADE_10'],
      topicSlugs: ['cac-tran-danh-lich-su', 'danh-nhan-lich-su', 'doc-lap-va-phong-kien'],
      periodSlugs: ['trieu-ngo-dinh-tien-le'],
      characters: [
        { characterSlug: 'ngo-quyen', role: 'Chủ tướng chỉ huy chiến dịch Bạch Đằng' },
      ],
      eventSlugs: ['chien-thang-bach-dang-938'],
      media: [
        {
          type: 'IMAGE' as const,
          url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
          title: 'Mô phỏng bãi cọc sông Bạch Đằng',
          description: 'Trận địa cọc gỗ bịt sắt độc đáo của Ngô Quyền',
          displayOrder: 1,
        },
      ],
      quiz: {
        title: 'Kiểm tra nhanh: Chiến thắng Bạch Đằng năm 938',
        description: 'Đánh giá mức độ nắm vững kiến thức về trận thủy chiến Bạch Đằng.',
        timeLimit: 300,
        passScore: 70,
        status: 'PUBLISHED' as const,
        questions: [
          {
            content: 'Ai là người lãnh đạo quân dân ta làm nên chiến thắng Bạch Đằng năm 938?',
            type: 'SINGLE_CHOICE' as const,
            points: 1,
            explanation: 'Ngô Quyền là vị chủ tướng chỉ huy trận địa cọc ngầm đánh bại quân Nam Hán.',
            displayOrder: 1,
            answers: [
              { content: 'Ngô Quyền', isCorrect: true, displayOrder: 1 },
              { content: 'Đinh Bộ Lĩnh', isCorrect: false, displayOrder: 2 },
              { content: 'Lý Thường Kiệt', isCorrect: false, displayOrder: 3 },
              { content: 'Trần Hưng Đạo', isCorrect: false, displayOrder: 4 },
            ],
          },
          {
            content: 'Quân giặc nào bị đánh bại trong trận Bạch Đằng năm 938?',
            type: 'SINGLE_CHOICE' as const,
            points: 1,
            explanation: 'Quân Nam Hán do Lưu Hoằng Tháo chỉ huy đã bị đại bại trên sông Bạch Đằng.',
            displayOrder: 2,
            answers: [
              { content: 'Quân Tống', isCorrect: false, displayOrder: 1 },
              { content: 'Quân Nam Hán', isCorrect: true, displayOrder: 2 },
              { content: 'Quân Nguyên Mông', isCorrect: false, displayOrder: 3 },
              { content: 'Quân Minh', isCorrect: false, displayOrder: 4 },
            ],
          },
          {
            content: 'Chiến thắng Bạch Đằng năm 938 có ý nghĩa lịch sử vĩ đại gì?',
            type: 'SINGLE_CHOICE' as const,
            points: 1,
            explanation: 'Trận thắng chấm dứt hơn 10 thế kỷ bị phong kiến phương Bắc đô hộ.',
            displayOrder: 3,
            answers: [
              { content: 'Chấm dứt hơn 1000 năm Bắc thuộc, mở ra kỷ nguyên độc lập', isCorrect: true, displayOrder: 1 },
              { content: 'Mở rộng lãnh thổ về phương Nam', isCorrect: false, displayOrder: 2 },
              { content: 'Dời đô về Thăng Long', isCorrect: false, displayOrder: 3 },
              { content: 'Thành lập nhà Trần', isCorrect: false, displayOrder: 4 },
            ],
          },
        ],
      },
    },

    // -------------------------------------------------------------------------
    // 2. Đinh Bộ Lĩnh và công cuộc dẹp loạn 12 sứ quân
    // -------------------------------------------------------------------------
    {
      title: 'Đinh Bộ Lĩnh dẹp loạn 12 sứ quân – Thống nhất giang sơn',
      slug: 'dinh-bo-linh-dep-loan-12-su-quan',
      summary:
        'Hành trình từ cậu bé chăn trâu cờ lau tập trận đến danh hiệu Vạn Thắng Vương, thống nhất non sông và đặt tên nước là Đại Cồ Việt.',
      thumbnail: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
      difficulty: 'MEDIUM' as const,
      estimatedTime: 15,
      displayOrder: 2,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Thời kỳ loạn 12 sứ quân</h2>
<p>Sau khi Ngô Quyền qua đời (năm 944), triều đình nhà Ngô rối ren, tranh giành quyền lực. Đất nước rơi vào tình cảnh cát cứ phân liệt của 12 sứ quân, nhân dân điêu đứng, mùa màng thất bát, nguy cơ ngoại xâm rình rập.</p>
<h2>2. Tài năng xuất chúng của Đinh Bộ Lĩnh</h2>
<p>Đinh Bộ Lĩnh quê ở động Hoa Lư (Ninh Bình). Từ thuở nhỏ, ông đã thể hiện chí khí hơn người khi cùng đám trẻ chăn trâu lấy <strong>hoa lau làm cờ</strong>, bày trận đánh giả và được chúng bạn tôn làm thủ lĩnh.</p>
<p>Nhờ tài mưu lược quân sự, kết hợp thu phục nhân tâm và liên kết các sứ quân yêu nước, Đinh Bộ Lĩnh lần lượt dẹp yên và thu phục các sứ quân, được suy tôn là <strong>Vạn Thắng Vương</strong>.</p>
<h2>3. Sự ra đời của nhà nước Đại Cồ Việt</h2>
<p>Năm 968, đất nước hoàn toàn thống nhất. Đinh Bộ Lĩnh lên ngôi Hoàng đế (Đinh Tiên Hoàng), lập nên triều Đinh:</p>
<ul>
  <li>Đặt tên nước là <strong>Đại Cồ Việt</strong> (nước Việt lớn).</li>
  <li>Chọn Hoa Lư làm kinh đô hiểm yếu.</li>
  <li>Đặt niên hiệu riêng là <em>Thái Bình</em>, khẳng định vị thế bình đẳng với các hoàng đế phương Bắc.</li>
  <li>Đúc đồng tiền <em>Thái Bình hưng bảo</em> — đồng tiền đầu tiên trong lịch sử tiền tệ Việt Nam.</li>
</ul>`,
      gradeCodes: ['GRADE_4', 'GRADE_7'],
      topicSlugs: ['danh-nhan-lich-su', 'doc-lap-va-phong-kien'],
      periodSlugs: ['trieu-ngo-dinh-tien-le'],
      characters: [
        { characterSlug: 'dinh-bo-linh', role: 'Vạn Thắng Vương - Vua sáng lập triều Đinh' },
      ],
      eventSlugs: [],
      media: [
        {
          type: 'IMAGE' as const,
          url: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop&q=80',
          title: 'Cố đô Hoa Lư - Ninh Bình',
          description: 'Kinh đô đầu tiên của nhà nước phong kiến trung ương tập quyền Việt Nam',
          displayOrder: 1,
        },
      ],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 3. Lý Thái Tổ và sự kiện dời đô về Thăng Long
    // -------------------------------------------------------------------------
    {
      title: 'Lý Thái Tổ và Chiếu dời đô về Thăng Long (1010)',
      slug: 'ly-thai-to-va-chieu-doi-do-thang-long',
      summary:
        'Tầm nhìn thiên tài của Lý Công Uẩn khi ban hành Chiếu dời đô năm 1010, chuyển trung tâm chính trị từ vùng núi Hoa Lư ra đồng bằng Thăng Long trù phú.',
      thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80',
      difficulty: 'EASY' as const,
      estimatedTime: 10,
      displayOrder: 3,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Bối cảnh ban hành Chiếu dời đô</h2>
<p>Năm 1009, Lý Công Uẩn được triều thần tôn lên ngôi Hoàng đế, sáng lập triều Lý (Lý Thái Tổ). Nhận thấy vùng đất Hoa Lư núi non hiểm trở chỉ thích hợp cho việc phòng ngự thời đầu độc lập, nay đất nước thanh bình cần một địa bàn rộng lớn để mở mang kinh tế và văn hóa lâu dài.</p>
<h2>2. Tầm nhìn chiến lược về đất Thăng Long</h2>
<p>Mùa thu năm 1010, Lý Thái Tổ ban <strong>Chiếu dời đô</strong> (Thiên đô chiếu), chỉ rõ vùng đất Đại La là:</p>
<blockquote>"Ở vào nơi trung tâm trời đất, được thế rồng cuộn hổ ngồi; chính giữa nam bắc đông tây, tiện nghi núi sau sông trước. Đất rộng mà bằng phẳng, thế đất cao mà sáng sủa; dân cư khỏi chịu cảnh khốn khổ ngập lụt, muôn vật rất mực phong phú tươi tốt..."</blockquote>
<h2>3. Rồng vàng xuất hiện và đổi tên Thăng Long</h2>
<p>Khi đoàn thuyền rồng của vua vừa cập bến dưới chân thành Đại La, có điềm lành rồng vàng bay lên, vua bèn đổi tên Đại La thành <strong>Thăng Long</strong> (Rồng bay lên).</p>
<h2>4. Ý nghĩa lịch sử</h2>
<p>Sự kiện dời đô mở ra một trang sử mới cho nước Đại Việt, đưa Thăng Long trở thành trái tim chính trị, kinh tế và văn hóa của đất nước suốt hơn một thiên niên kỷ.</p>`,
      gradeCodes: ['GRADE_4', 'GRADE_7', 'GRADE_10'],
      topicSlugs: ['doc-lap-va-phong-kien', 'danh-nhan-lich-su', 'van-hoa-nghe-thuat-truyen-thong'],
      periodSlugs: ['trieu-ly'],
      characters: [
        { characterSlug: 'ly-cong-uan', role: 'Vua Lý Thái Tổ - người ban Chiếu dời đô' },
      ],
      eventSlugs: ['doi-do-ve-thang-long'],
      media: [
        {
          type: 'IMAGE' as const,
          url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200&auto=format&fit=crop&q=80',
          title: 'Tượng đài Vua Lý Thái Tổ tại Hà Nội',
          description: 'Tượng đài tưởng niệm người có công dời đô về Thăng Long năm 1010',
          displayOrder: 1,
        },
      ],
      quiz: {
        title: 'Trắc nghiệm: Sự kiện Dời đô về Thăng Long',
        description: 'Kiểm tra hiểu biết về Chiếu dời đô và vị vua Lý Thái Tổ.',
        timeLimit: 240,
        passScore: 60,
        status: 'PUBLISHED' as const,
        questions: [
          {
            content: 'Năm nào Lý Công Uẩn quyết định dời đô từ Hoa Lư về Thăng Long?',
            type: 'SINGLE_CHOICE' as const,
            points: 1,
            explanation: 'Năm Canh Tuất 1010, vua Lý Thái Tổ ban Chiếu dời đô từ Hoa Lư về thành Đại La (Thăng Long).',
            displayOrder: 1,
            answers: [
              { content: 'Năm 938', isCorrect: false, displayOrder: 1 },
              { content: 'Năm 1010', isCorrect: true, displayOrder: 2 },
              { content: 'Năm 1285', isCorrect: false, displayOrder: 3 },
              { content: 'Năm 1428', isCorrect: false, displayOrder: 4 },
            ],
          },
          {
            content: 'Tên gọi "Thăng Long" mang ý nghĩa gì?',
            type: 'SINGLE_CHOICE' as const,
            points: 1,
            explanation: 'Thăng Long nghĩa là Rồng bay lên, tượng trưng cho sự hưng thịnh vươn mình của đất nước.',
            displayOrder: 2,
            answers: [
              { content: 'Rồng bay lên', isCorrect: true, displayOrder: 1 },
              { content: 'Đất lành chim đậu', isCorrect: false, displayOrder: 2 },
              { content: 'Thành phố hòa bình', isCorrect: false, displayOrder: 3 },
              { content: 'Rồng ẩn mình', isCorrect: false, displayOrder: 4 },
            ],
          },
        ],
      },
    },

    // -------------------------------------------------------------------------
    // 4. Trần Hưng Đạo và ba lần đánh thắng quân Nguyên Mông
    // -------------------------------------------------------------------------
    {
      title: 'Hào khí Đông A: Ba lần đại thắng quân xâm lược Mông - Nguyên',
      slug: 'hao-khi-dong-a-ba-lan-dai-thang-nguyen-mong',
      summary:
        'Sức mạnh đoàn kết toàn dân tộc dưới triều Trần, từ Hội nghị Diên Hồng đến tài thao lược quân sự của Hưng Đạo Đại Vương Trần Quốc Tuấn.',
      thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      difficulty: 'HARD' as const,
      estimatedTime: 20,
      displayOrder: 4,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Đạo quân bách chiến bách thắng Nguyên - Mông</h2>
<p>Vào thế kỷ XIII, vó ngựa quân Mông Cổ làm rung chuyển cả lục địa Á - Âu, tiêu diệt nhiều quốc gia hùng mạnh từ Trung Hoa đến Đông Âu. Nhưng khi tiến vào bờ cõi Đại Việt (các năm 1258, 1285 và 1287-1288), chúng liên tiếp bị thất bại cay đắng.</p>
<h2>2. Hội nghị Bình Than và Hội nghị Diên Hồng</h2>
<p>Điểm tựa làm nên kỳ tích nhà Trần chính là sự đồng lòng trên dưới như một:</p>
<ul>
  <li><strong>Hội nghị Diên Hồng (1284):</strong> Thượng hoàng Trần Thánh Tông triệu tập các bô lão cả nước hỏi kế sách: <em>"Nên đánh hay nên hòa?"</em>. Muôn người cùng một lời đồng thanh hô vang: <strong>"ĐÁNH!"</strong>.</li>
  <li><strong>Hịch tướng sĩ:</strong> Trần Quốc Tuấn khơi dậy tinh thần yêu nước, lòng căm thù giặc sục sôi của tướng sĩ với quyết tâm "Sát Thát".</li>
</ul>
<h2>3. Nghệ thuật chiến tranh nhân dân độc đáo</h2>
<p>Nhà Trần áp dụng chiến thuật <em>"Vườn không nhà trống"</em> khiến quân giặc sa lầy, thiếu lương ăn trầm trọng; sau đó nắm lấy thời cơ phản công thần tốc tiêu diệt các đạo quân tinh nhuệ ở Hàm Tử, Chương Dương, Tây Kết, Vạn Kiếp và đỉnh cao là trận thủy chiến Bạch Đằng năm 1288.</p>
<h2>4. Tinh thần đoàn kết là cội nguồn sức mạnh</h2>
<blockquote>"Vừa rồi Toa Đô, Ô Mã Nhi bốn mặt bao vây, nếu không có vua tôi đồng tâm, anh em hòa mục, cả nước góp sức thì làm sao phá được giặc?" — <em>Trần Hưng Đạo</em></blockquote>`,
      gradeCodes: ['GRADE_7', 'GRADE_10', 'GRADE_11'],
      topicSlugs: ['cac-tran-danh-lich-su', 'danh-nhan-lich-su', 'doc-lap-va-phong-kien'],
      periodSlugs: ['trieu-tran'],
      characters: [
        { characterSlug: 'tran-hung-dao', role: 'Tiết chế Quốc công - Tổng chỉ huy quân đội Đại Việt' },
      ],
      eventSlugs: ['hoi-nghi-dien-hong'],
      media: [
        {
          type: 'IMAGE' as const,
          url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
          title: 'Hịch tướng sĩ và Hào khí Đông A',
          description: 'Tinh thần quyết chiến quyết thắng bảo vệ độc lập non sông',
          displayOrder: 1,
        },
      ],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 5. Khởi nghĩa Lam Sơn và khúc ca Bình Ngô Đại Cáo
    // -------------------------------------------------------------------------
    {
      title: 'Khởi nghĩa Lam Sơn và khúc ca khải hoàn Bình Ngô Đại Cáo',
      slug: 'khoi-nghia-lam-son-va-binh-ngo-dai-cao',
      summary:
        'Cuộc khởi nghĩa trường kỳ 10 năm gian khổ từ đất Lam Sơn do Lê Lợi và Nguyễn Trãi lãnh đạo đánh đuổi ách đô hộ nhà Minh, khôi phục nền thái bình thịnh trị.',
      thumbnail: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?w=800&auto=format&fit=crop&q=80',
      difficulty: 'MEDIUM' as const,
      estimatedTime: 18,
      displayOrder: 5,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Ách đô hộ tàn bạo của giặc Minh</h2>
<p>Đầu thế kỷ XV, nhà Hồ sụp đổ, giặc Minh đô hộ nước ta. Chúng bóc lột cùng kiệt, vơ vét tài nguyên, thi hành chính sách đồng hóa văn hóa tàn bạo, đẩy nhân dân ta vào cảnh lầm than:</p>
<blockquote>"Nướng dân đen trên ngọn lửa hung tàn,<br>Vùi con đỏ xuống dưới hầm tai vạ." — <em>Bình Ngô Đại Cáo</em></blockquote>
<h2>2. Ngọn cờ tụ nghĩa Lam Sơn</h2>
<p>Đầu năm 1418, tại vùng đất Lam Sơn (Thanh Hóa), Lê Lợi cùng 18 hào kiệt họp Hội thề Lũng Nhai, dựng cờ khởi nghĩa với danh hiệu <strong>Bình Định Vương</strong>.</p>
<p>Những năm đầu vô cùng gian nan, nghĩa quân nhiều lần bị bao vây ở núi Chí Linh, phải ăn măng rừng rau dại nhưng lòng quyết tâm không hề nao núng.</p>
<h2>3. Chiến lược xoay chuyển tình thế</h2>
<p>Theo mưu kế của tướng Nguyễn Chích, nghĩa quân tiến đánh vào Nghệ An giải phóng vùng đất rộng lớn, sau đó tiến quân ra Bắc. Các chiến thắng Tốt Động - Chúc Động và đỉnh cao Chi Lăng - Xương Giang đã tiêu diệt hoàn toàn viện binh Liễu Thăng, buộc tướng giặc Vương Thông phải xin hàng tại Đông Quan.</p>
<h2>4. Bình Ngô Đại Cáo – Bản tuyên ngôn độc lập</h2>
<p>Mùa xuân năm 1428, Lê Lợi lên ngôi vua, sai Nguyễn Trãi soạn <strong>Bình Ngô Đại Cáo</strong>, tuyên bố kết thúc chiến tranh, mở ra kỷ nguyên thái bình của triều Hậu Lê.</p>`,
      gradeCodes: ['GRADE_7', 'GRADE_10'],
      topicSlugs: ['cac-tran-danh-lich-su', 'danh-nhan-lich-su', 'doc-lap-va-phong-kien'],
      periodSlugs: ['trieu-le-so'],
      characters: [
        { characterSlug: 'le-loi', role: 'Bình Định Vương - Lãnh tụ tối cao khởi nghĩa Lam Sơn' },
      ],
      eventSlugs: ['khoi-nghia-lam-son'],
      media: [],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 6. Quang Trung và chiến thắng Ngọc Hồi - Đống Đa
    // -------------------------------------------------------------------------
    {
      title: 'Quang Trung và đại thắng mùa xuân Kỷ Dậu 1789 (Ngọc Hồi - Đống Đa)',
      slug: 'quang-trung-va-dai-thang-ngoc-hoi-dong-da',
      summary:
        'Nghệ thuật quân sự thần tốc của thiên tài quân sự Nguyễn Huệ đánh tan 29 vạn quân Mãn Thanh trong dịp Tết Kỷ Dậu 1789.',
      thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      difficulty: 'MEDIUM' as const,
      estimatedTime: 16,
      displayOrder: 6,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Nguy cơ ngoại xâm từ phương Bắc</h2>
<p>Cuối năm 1788, vua Lê Chiêu Thống hèn nhát cầu viện triều đình Mãn Thanh. Càn Long sai Tổng đốc Lưỡng Quảng Tôn Sĩ Nghị thống lĩnh 29 vạn quân tràn sang chiếm đóng kinh thành Thăng Long.</p>
<h2>2. Lên ngôi hoàng đế và hành quân thần tốc</h2>
<p>Nhận được cấp báo, Nguyễn Huệ làm lễ tế trời đất tại núi Bân (Huế), lên ngôi Hoàng đế lấy niên hiệu <strong>Quang Trung</strong> rồi lập tức dẫn đại quân tiến ra Bắc.</p>
<p>Vua tổ chức hành quân với tốc độ thần kỳ: vừa đi vừa tuyển quân và tập luyện, chỉ trong vài ngày đã tới Tam Điệp (Ninh Bình). Tại đây, vua cho tướng sĩ ăn Tết trước và hẹn mùng 7 Tết sẽ vào Thăng Long mở tiệc khải hoàn.</p>
<blockquote>"Đánh cho để dài tóc,<br>Đánh cho để đen răng,<br>Đánh cho nó chích luân bất phản,<br>Đánh cho nó phiến giáp bất hoàn,<br>Đánh cho sử tri nam quốc anh hùng chi hữu chủ!" — <em>Lời hịch vua Quang Trung</em></blockquote>
<h2>3. Đêm mùng 4 rạng sáng mùng 5 Tết Kỷ Dậu</h2>
<p>Quân Tây Sơn đồng loạt công phá đồn Ngọc Hồi và đồn Khương Thượng (Đống Đa). Tướng giặc Sầm Nghi Đống khiếp sợ thắt cổ tự tử; Tôn Sĩ Nghị hoảng hốt bỏ cả ấn tín tháo chạy qua cầu phao sông Hồng làm cầu đứt, xác giặc trôi nghẽn khúc sông.</p>
<p>Đúng trưa mùng 5 Tết, Hoàng đế Quang Trung trong tấm áo bào xạm đen khói súng dẫn đầu đoàn quân chiến thắng tiến vào Thăng Long giữa tiếng reo hò rực rỡ của muôn dân.</p>`,
      gradeCodes: ['GRADE_5', 'GRADE_8', 'GRADE_11'],
      topicSlugs: ['cac-tran-danh-lich-su', 'danh-nhan-lich-su'],
      periodSlugs: ['doc-lap-va-phong-kien'],
      characters: [
        { characterSlug: 'quang-trung-nguyen-hue', role: 'Hoàng đế kiêm Tổng chỉ huy chiến dịch' },
      ],
      eventSlugs: ['tran-ngoc-hoi-dong-da'],
      media: [],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 7. Chiến dịch Điện Biên Phủ 1954
    // -------------------------------------------------------------------------
    {
      title: 'Chiến dịch Điện Biên Phủ (1954) – Lừng lẫy năm châu, chấn động địa cầu',
      slug: 'chien-dich-dien-bien-phu-1954',
      summary:
        'Toàn cảnh 56 ngày đêm khoét núi ngủ hầm của quân và dân ta, đập tan tập đoàn cứ điểm quân sự mạnh nhất của thực dân Pháp tại Đông Dương.',
      thumbnail: 'https://images.unsplash.com/photo-1569974498991-d3c12a504f95?w=800&auto=format&fit=crop&q=80',
      difficulty: 'HARD' as const,
      estimatedTime: 22,
      displayOrder: 7,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Âm mưu của thực dân Pháp tại Điện Biên Phủ</h2>
<p>Cuối năm 1953, tướng Nava xây dựng Điện Biên Phủ thành một tập đoàn cứ điểm kiên cố nhất Đông Dương với 49 cứ điểm, 3 phân khu, 2 sân bay quân sự được mệnh danh là <em>"pháo đài bất khả xâm phạm"</em>.</p>
<h2>2. Quyết định lịch sử chuyển phương châm tác chiến</h2>
<p>Đại tướng Võ Nguyên Giáp trên cương vị Chỉ huy trưởng mặt trận đã đưa ra một quyết định khó khăn nhưng sáng suốt nhất trong đời cầm quân: chuyển từ <strong>"Đánh nhanh, thắng nhanh"</strong> sang <strong>"Đánh chắc, tiến chắc"</strong>.</p>
<h2>3. 56 ngày đêm bão lửa</h2>
<p>Chiến dịch diễn ra qua ba đợt công kích ác liệt:</p>
<ul>
  <li><strong>Đợt 1 (13/3 – 17/3):</strong> Tiêu diệt cụm cứ điểm Him Lam, Độc Lập, bức hàng Bản Kéo.</li>
  <li><strong>Đợt 2 (30/3 – 26/4):</strong> Đánh chiếm các cao điểm phía đông (đồi A1, C1, D1...), thắt chặt vòng vây chiến hào.</li>
  <li><strong>Đợt 3 (01/5 – 07/5):</strong> Tổng công kích dứt điểm các cứ điểm còn lại. Chiều 7/5/1954, lá cờ "Quyết chiến Quyết thắng" tung bay trên nóc hầm tướng Đờ Cát-xtơ-ri, toàn bộ quân Pháp đầu hàng.</li>
</ul>
<h2>4. Ý nghĩa thời đại</h2>
<p>Chiến thắng Điện Biên Phủ đã giáng đòn quyết định đập tan ách thống trị của thực dân Pháp, buộc Pháp ký Hiệp định Giơ-ne-vơ lập lại hòa bình ở Đông Dương, trở thành nguồn cổ vũ lớn lao cho phong trào giải phóng dân tộc trên toàn thế giới.</p>`,
      gradeCodes: ['GRADE_5', 'GRADE_9', 'GRADE_12'],
      topicSlugs: ['cac-tran-danh-lich-su', 'khang-chien-chong-phap'],
      periodSlugs: ['thoi-ky-phap-thuoc'],
      characters: [],
      eventSlugs: ['chien-dich-dien-bien-phu'],
      media: [
        {
          type: 'IMAGE' as const,
          url: 'https://images.unsplash.com/photo-1569974498991-d3c12a504f95?w=1200&auto=format&fit=crop&q=80',
          title: 'Chiến trường Điện Biên Phủ',
          description: 'Hình ảnh cứ điểm và chiến hào lịch sử năm 1954',
          displayOrder: 1,
        },
      ],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 8. Thời đại Hùng Vương dựng nước
    // -------------------------------------------------------------------------
    {
      title: 'Thời đại các Vua Hùng dựng nước – Buổi bình minh dân tộc',
      slug: 'thoi-dai-cac-vua-hung-dung-nuoc',
      summary:
        'Tìm hiểu về cội nguồn dân tộc, sự tích Con Rồng Cháu Tiên, nhà nước Văn Lang và nền văn minh lúa nước sông Hồng buổi đầu dựng nước.',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      difficulty: 'EASY' as const,
      estimatedTime: 10,
      displayOrder: 8,
      status: 'PUBLISHED' as const,
      content: `<h2>1. Truyền thuyết Lạc Long Quân và Âu Cơ</h2>
<p>Từ ngàn xưa, người Việt luôn tự hào với nguồn gốc <strong>"Con Rồng Cháu Tiên"</strong>. Bọc trăm trứng của Mẹ Âu Cơ nở ra một trăm người con, năm mươi người theo cha xuống biển, năm mươi người theo mẹ lên núi, cùng nhau khai phá non sông đất nước.</p>
<h2>2. Nhà nước Văn Lang – Nhà nước đầu tiên</h2>
<p>Người con trưởng được tôn lên làm vua, xưng là <strong>Hùng Vương</strong>, đóng đô tại Phong Châu (Phú Thọ ngày nay), đặt tên nước là <strong>Văn Lang</strong>.</p>
<ul>
  <li>Vua đứng đầu đất nước, cha truyền con nối.</li>
  <li>Giúp việc cho vua có các <em>Lạc hầu</em>, tướng chỉ huy quân sự là các <em>Lạc tướng</em>.</li>
  <li>Các địa phương chia thành các <em>bộ</em>, do Lạc tướng cai quản.</li>
</ul>
<h2>3. Đời sống vật chất và tinh thần</h2>
<p>Cư dân Văn Lang đã thuần thục kỹ thuật đúc đồng với biểu tượng đỉnh cao là <strong>Trống đồng Đông Sơn</strong>. Đời sống sinh hoạt phong phú với tục ăn trầu, nhuộm răng đen, làm bánh chưng, bánh giầy trong các dịp lễ hội mừng mùa màng.</p>`,
      gradeCodes: ['GRADE_4', 'GRADE_6', 'GRADE_10'],
      topicSlugs: ['lich-su-viet-nam-co-dai', 'van-hoa-nghe-thuat-truyen-thong'],
      periodSlugs: ['thoi-ky-hung-vuong'],
      characters: [],
      eventSlugs: [],
      media: [],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 9. [DRAFT] Phong trào Cần Vương
    // -------------------------------------------------------------------------
    {
      title: '[Dự thảo] Phong trào Cần Vương và các cuộc khởi nghĩa tiêu biểu cuối thế kỷ XIX',
      slug: 'phong-trao-can-vuong-cuoi-the-ky-xix',
      summary:
        'Tài liệu dự thảo nghiên cứu về phong trào yêu nước phò vua cứu nước dưới ngọn cờ của vua Hàm Nghi và các danh nhân Tôn Thất Thuyết, Phan Đình Phùng.',
      thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
      difficulty: 'MEDIUM' as const,
      estimatedTime: 15,
      displayOrder: 9,
      status: 'DRAFT' as const,
      content: `<h2>1. Bối cảnh bùng nổ phong trào</h2>
<p>Sau khi thực dân Pháp đánh chiếm Bắc Kỳ và ép triều đình Huế ký Hiệp ước Hác-măng (1883) và Pa-tơ-nốt (1884), phe chủ chiến do Tôn Thất Thuyết đứng đầu đã kiên quyết phản kháng.</p>
<h2>2. Chiếu Cần Vương ban bố</h2>
<p>Tháng 7 năm 1885, sau cuộc tấn công đồn Mang Cá không thành, Tôn Thất Thuyết rước vua trẻ Hàm Nghi ra căn cứ Tân Sở (Quảng Trị) và ban Chiếu Cần Vương, kêu gọi sĩ phu và nhân dân cả nước đứng lên phò vua giúp nước.</p>
<h2>3. Các cuộc khởi nghĩa tiêu biểu</h2>
<ul>
  <li>Khởi nghĩa Ba Đình (1886 - 1887) do Phạm Bành và Đinh Công Tráng lãnh đạo.</li>
  <li>Khởi nghĩa Bãi Sậy (1883 - 1892) do Nguyễn Thiện Thuật chỉ huy.</li>
  <li>Khởi nghĩa Hương Khê (1885 - 1896) do Phan Đình Phùng chỉ huy — đỉnh cao của phong trào Cần Vương.</li>
</ul>`,
      gradeCodes: ['GRADE_8', 'GRADE_11'],
      topicSlugs: ['khang-chien-chong-phap'],
      periodSlugs: ['thoi-ky-phap-thuoc'],
      characters: [],
      eventSlugs: [],
      media: [],
      quiz: null,
    },

    // -------------------------------------------------------------------------
    // 10. [ARCHIVED] Vũ khí và chiến thuật thời phong kiến Lý - Trần
    // -------------------------------------------------------------------------
    {
      title: '[Lưu trữ] Tổng quan tổ chức quân sự và vũ trang thời Lý - Trần',
      slug: 'tong-quan-to-chuc-quan-su-ly-tran',
      summary:
        'Chuyên đề tư liệu lưu trữ về chính sách Ngụ binh ư nông, cơ cấu bộ binh, thủy binh và trang bị vũ khí cổ truyền thời Lý - Trần.',
      thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80',
      difficulty: 'HARD' as const,
      estimatedTime: 18,
      displayOrder: 10,
      status: 'ARCHIVED' as const,
      content: `<h2>1. Chính sách "Ngụ binh ư nông"</h2>
<p>Nhà Lý và nhà Trần áp dụng chính sách <em>"Gửi binh lính ở nhà nông"</em>: thời bình cho quân lính luân phiên về quê sản xuất nông nghiệp, khi có biến động chiến tranh lập tức động viên toàn bộ thanh niên lên đường tòng quân.</p>
<h2>2. Tổ chức lực lượng</h2>
<ul>
  <li><strong>Cấm quân:</strong> Đội quân tinh nhuệ túc trực bảo vệ triều đình và Hoàng thành.</li>
  <li><strong>Lộ quân:</strong> Lực lượng quân đội đồn trú và phòng thủ tại các lộ, phủ trên toàn quốc.</li>
</ul>
<h2>3. Vũ khí trang bị</h2>
<p>Bộ binh trang bị giáo mác, đao kiếm, cung nỏ và khiên mây. Thủy quân sử dụng các loại chiến thuyền nhẹ, cơ động, trang bị hỏa hổ và câu liêm chuyên dụng cho việc đánh thủy chiến trên các luồng lạch hiểm trở.</p>`,
      gradeCodes: ['GRADE_7', 'GRADE_10'],
      topicSlugs: ['doc-lap-va-phong-kien'],
      periodSlugs: ['trieu-ly', 'trieu-tran'],
      characters: [],
      eventSlugs: [],
      media: [],
      quiz: null,
    },
  ];

  let count = 0;
  for (const item of lessonsData) {
    const {
      gradeCodes,
      topicSlugs,
      periodSlugs,
      characters: lessonCharacters,
      eventSlugs,
      media: lessonMedia,
      quiz: quizData,
      ...lessonFields
    } = item;

    // 1. Upsert Lesson
    const lesson = await prisma.lesson.upsert({
      where: { slug: lessonFields.slug },
      update: {
        title: lessonFields.title,
        summary: lessonFields.summary,
        content: lessonFields.content,
        thumbnail: lessonFields.thumbnail,
        difficulty: lessonFields.difficulty,
        estimatedTime: lessonFields.estimatedTime,
        displayOrder: lessonFields.displayOrder,
        status: lessonFields.status,
      },
      create: {
        title: lessonFields.title,
        slug: lessonFields.slug,
        summary: lessonFields.summary,
        content: lessonFields.content,
        thumbnail: lessonFields.thumbnail,
        difficulty: lessonFields.difficulty,
        estimatedTime: lessonFields.estimatedTime,
        displayOrder: lessonFields.displayOrder,
        status: lessonFields.status,
      },
    });

    // 2. Clear old relational links for clean re-seeding
    await prisma.lessonGrade.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonTopic.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonPeriod.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonCharacter.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonEvent.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonMedia.deleteMany({ where: { lessonId: lesson.id } });

    // 3. Connect Grades
    for (const code of gradeCodes) {
      const gradeId = gradeMap.get(code);
      if (gradeId) {
        await prisma.lessonGrade.create({
          data: { lessonId: lesson.id, gradeId },
        });
      }
    }

    // 4. Connect Topics
    for (const slug of topicSlugs) {
      const topicId = topicMap.get(slug);
      if (topicId) {
        await prisma.lessonTopic.create({
          data: { lessonId: lesson.id, topicId },
        });
      }
    }

    // 5. Connect Periods
    for (const slug of periodSlugs) {
      const periodId = periodMap.get(slug);
      if (periodId) {
        await prisma.lessonPeriod.create({
          data: { lessonId: lesson.id, periodId },
        });
      }
    }

    // 6. Connect Characters (with role)
    for (const charItem of lessonCharacters) {
      const characterId = characterMap.get(charItem.characterSlug);
      if (characterId) {
        await prisma.lessonCharacter.create({
          data: {
            lessonId: lesson.id,
            characterId,
            role: charItem.role,
          },
        });
      }
    }

    // 7. Connect Events
    for (const slug of eventSlugs) {
      const eventId = eventMap.get(slug);
      if (eventId) {
        await prisma.lessonEvent.create({
          data: { lessonId: lesson.id, eventId },
        });
      }
    }

    // 8. Add Media items
    if (lessonMedia && lessonMedia.length > 0) {
      for (const mediaItem of lessonMedia) {
        await prisma.lessonMedia.create({
          data: {
            lessonId: lesson.id,
            type: mediaItem.type,
            url: mediaItem.url,
            title: mediaItem.title,
            description: mediaItem.description,
            displayOrder: mediaItem.displayOrder,
          },
        });
      }
    }

    // 9. Optional Quiz with questions & answers
    if (quizData) {
      // Check existing quiz
      const existingQuiz = await prisma.quiz.findUnique({
        where: { lessonId: lesson.id },
      });

      if (existingQuiz) {
        await prisma.question.deleteMany({ where: { quizId: existingQuiz.id } });
        await prisma.quiz.update({
          where: { id: existingQuiz.id },
          data: {
            title: quizData.title,
            description: quizData.description,
            timeLimit: quizData.timeLimit,
            passScore: quizData.passScore,
            status: quizData.status,
          },
        });
        for (const q of quizData.questions) {
          await prisma.question.create({
            data: {
              quizId: existingQuiz.id,
              content: q.content,
              type: q.type,
              points: q.points,
              explanation: q.explanation,
              displayOrder: q.displayOrder,
              answers: {
                create: q.answers.map((a) => ({
                  content: a.content,
                  isCorrect: a.isCorrect,
                  displayOrder: a.displayOrder,
                })),
              },
            },
          });
        }
      } else {
        const createdQuiz = await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            title: quizData.title,
            description: quizData.description,
            timeLimit: quizData.timeLimit,
            passScore: quizData.passScore,
            status: quizData.status,
          },
        });
        for (const q of quizData.questions) {
          await prisma.question.create({
            data: {
              quizId: createdQuiz.id,
              content: q.content,
              type: q.type,
              points: q.points,
              explanation: q.explanation,
              displayOrder: q.displayOrder,
              answers: {
                create: q.answers.map((a) => ({
                  content: a.content,
                  isCorrect: a.isCorrect,
                  displayOrder: a.displayOrder,
                })),
              },
            },
          });
        }
      }
    }

    count++;
  }

  console.log(`  ✓ Seeded ${count} lessons successfully`);
}
