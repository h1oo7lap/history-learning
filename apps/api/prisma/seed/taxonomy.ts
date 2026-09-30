import type { PrismaClient } from '../../src/generated/prisma/client';

export async function seedTaxonomy(prisma: PrismaClient) {
  console.log('  Seeding topics and periods...');

  const topics = [
    { name: 'Lịch sử Việt Nam cổ đại', slug: 'lich-su-viet-nam-co-dai', displayOrder: 1 },
    { name: 'Thời kỳ Bắc thuộc', slug: 'thoi-ky-bac-thuoc', displayOrder: 2 },
    { name: 'Độc lập và phong kiến', slug: 'doc-lap-va-phong-kien', displayOrder: 3 },
    { name: 'Kháng chiến chống Pháp', slug: 'khang-chien-chong-phap', displayOrder: 4 },
    { name: 'Kháng chiến chống Mỹ', slug: 'khang-chien-chong-my', displayOrder: 5 },
    { name: 'Lịch sử thế giới cổ đại', slug: 'lich-su-the-gioi-co-dai', displayOrder: 6 },
    { name: 'Lịch sử thế giới trung đại', slug: 'lich-su-the-gioi-trung-dai', displayOrder: 7 },
    { name: 'Lịch sử thế giới cận đại', slug: 'lich-su-the-gioi-can-dai', displayOrder: 8 },
  ];

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: topic,
    });
  }

  const periods = [
    { name: 'Thời kỳ Hùng Vương', slug: 'thoi-ky-hung-vuong', startYear: -2879, endYear: -258, displayOrder: 1 },
    { name: 'Bắc thuộc lần thứ nhất', slug: 'bac-thuoc-lan-thu-nhat', startYear: -111, endYear: 39, displayOrder: 2 },
    { name: 'Triều Ngô - Đinh - Tiền Lê', slug: 'trieu-ngo-dinh-tien-le', startYear: 939, endYear: 1009, displayOrder: 3 },
    { name: 'Triều Lý', slug: 'trieu-ly', startYear: 1009, endYear: 1225, displayOrder: 4 },
    { name: 'Triều Trần', slug: 'trieu-tran', startYear: 1225, endYear: 1400, displayOrder: 5 },
    { name: 'Triều Lê sơ', slug: 'trieu-le-so', startYear: 1428, endYear: 1527, displayOrder: 6 },
    { name: 'Thời kỳ Pháp thuộc', slug: 'thoi-ky-phap-thuoc', startYear: 1858, endYear: 1945, displayOrder: 7 },
    { name: 'Kháng chiến chống Mỹ', slug: 'khang-chien-chong-my-period', startYear: 1954, endYear: 1975, displayOrder: 8 },
  ];

  for (const period of periods) {
    await prisma.historicalPeriod.upsert({
      where: { slug: period.slug },
      update: {},
      create: period,
    });
  }

  console.log('  ✓ Taxonomy seed done');
}
