import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Seed core data
  const { seedCore } = await import('./seed/core');
  await seedCore(prisma);

  // Seed taxonomy
  const { seedTaxonomy } = await import('./seed/taxonomy');
  await seedTaxonomy(prisma);

  // Seed gamification (levels, missions, cards)
  const { seedGamification } = await import('./seed/gamification');
  await seedGamification(prisma);

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
