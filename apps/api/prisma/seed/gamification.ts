import type { PrismaClient } from '../../src/generated/prisma/client';

export async function seedGamification(prisma: PrismaClient) {
  console.log('  Seeding missions and history cards...');

  // Missions (one per type + variants)
  const missions = [
    {
      title: 'Học giỏi!',
      description: 'Hoàn thành 1 bài học đầu tiên của bạn',
      type: 'COMPLETE_LESSON' as const,
      target: 1,
      rewardExp: 30,
    },
    {
      title: 'Ham học hỏi',
      description: 'Hoàn thành 5 bài học',
      type: 'COMPLETE_LESSON' as const,
      target: 5,
      rewardExp: 100,
    },
    {
      title: 'Thử sức đầu tiên',
      description: 'Làm bài kiểm tra đầu tiên',
      type: 'COMPLETE_QUIZ' as const,
      target: 1,
      rewardExp: 30,
    },
    {
      title: 'Học sinh xuất sắc',
      description: 'Vượt qua 3 bài kiểm tra',
      type: 'PASS_QUIZ' as const,
      target: 3,
      rewardExp: 150,
    },
    {
      title: 'Nhà sưu tập',
      description: 'Thu thập thẻ lịch sử đầu tiên',
      type: 'COLLECT_CARD' as const,
      target: 1,
      rewardExp: 50,
    },
    {
      title: 'Đam mê lịch sử',
      description: 'Thu thập 5 thẻ lịch sử',
      type: 'COLLECT_CARD' as const,
      target: 5,
      rewardExp: 200,
    },
  ];

  // Use title-based lookup since Mission has no unique slug field
  for (const mission of missions) {
    const existing = await prisma.mission.findFirst({ where: { title: mission.title } });
    if (!existing) {
      await prisma.mission.create({ data: mission });
    }
  }

  // History Cards (15 with mix of rarities and unlock types)
  const cards = [
    {
      name: 'Trần Hưng Đạo',
      slug: 'tran-hung-dao',
      type: 'CHARACTER' as const,
      rarity: 'LEGENDARY' as const,
      shortDescription: 'Vị anh hùng dân tộc đã ba lần đánh bại quân Mông - Nguyên',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Lý Thường Kiệt',
      slug: 'ly-thuong-kiet',
      type: 'CHARACTER' as const,
      rarity: 'EPIC' as const,
      shortDescription: 'Danh tướng nhà Lý, tác giả bài thơ "Nam quốc sơn hà"',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Hùng Vương',
      slug: 'hung-vuong',
      type: 'CHARACTER' as const,
      rarity: 'RARE' as const,
      shortDescription: 'Các vị vua của nhà nước Văn Lang',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Nguyễn Trãi',
      slug: 'nguyen-trai',
      type: 'CHARACTER' as const,
      rarity: 'EPIC' as const,
      shortDescription: 'Nhà chính trị, nhà văn hóa kiệt xuất thời Lê sơ',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Đinh Bộ Lĩnh',
      slug: 'dinh-bo-linh',
      type: 'CHARACTER' as const,
      rarity: 'RARE' as const,
      shortDescription: 'Người thống nhất 12 sứ quân, lập ra nhà Đinh',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Trận Bạch Đằng 938',
      slug: 'tran-bach-dang-938',
      type: 'EVENT' as const,
      rarity: 'LEGENDARY' as const,
      shortDescription: 'Chiến thắng lịch sử của Ngô Quyền trước quân Nam Hán',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Trận Điện Biên Phủ',
      slug: 'tran-dien-bien-phu',
      type: 'EVENT' as const,
      rarity: 'EPIC' as const,
      shortDescription: 'Chiến thắng lẫy lừng kết thúc kháng chiến chống Pháp',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Trống đồng Đông Sơn',
      slug: 'trong-dong-dong-son',
      type: 'ARTIFACT' as const,
      rarity: 'RARE' as const,
      shortDescription: 'Biểu tượng của nền văn hóa Đông Sơn rực rỡ',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Thành Cổ Loa',
      slug: 'thanh-co-loa',
      type: 'LOCATION' as const,
      rarity: 'RARE' as const,
      shortDescription: 'Kinh đô của nước Âu Lạc thời An Dương Vương',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Hồ Gươm',
      slug: 'ho-guom',
      type: 'LOCATION' as const,
      rarity: 'COMMON' as const,
      shortDescription: 'Hồ gắn liền với truyền thuyết trả gươm của vua Lê',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Nguyễn Huệ',
      slug: 'nguyen-hue',
      type: 'CHARACTER' as const,
      rarity: 'LEGENDARY' as const,
      shortDescription: 'Hoàng đế Quang Trung, người anh hùng áo vải đất Tây Sơn',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Hai Bà Trưng',
      slug: 'hai-ba-trung',
      type: 'CHARACTER' as const,
      rarity: 'EPIC' as const,
      shortDescription: 'Hai vị nữ anh hùng đầu tiên lãnh đạo khởi nghĩa chống Bắc thuộc',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Chiếu dời đô',
      slug: 'chieu-doi-do',
      type: 'ARTIFACT' as const,
      rarity: 'RARE' as const,
      shortDescription: 'Bài chiếu dời đô của vua Lý Thái Tổ từ Hoa Lư về Thăng Long',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Văn Miếu - Quốc Tử Giám',
      slug: 'van-mieu-quoc-tu-giam',
      type: 'LOCATION' as const,
      rarity: 'COMMON' as const,
      shortDescription: 'Trường đại học đầu tiên của Việt Nam, được xây năm 1076',
      unlockType: 'NONE' as const,
    },
    {
      name: 'Bình Ngô đại cáo',
      slug: 'binh-ngo-dai-cao',
      type: 'ARTIFACT' as const,
      rarity: 'EPIC' as const,
      shortDescription: 'Bản tuyên ngôn độc lập thứ hai của dân tộc Việt Nam',
      unlockType: 'NONE' as const,
    },
  ];

  for (const card of cards) {
    await prisma.historyCard.upsert({
      where: { slug: card.slug },
      update: {},
      create: card,
    });
  }

  console.log('  ✓ Gamification seed done');
}
