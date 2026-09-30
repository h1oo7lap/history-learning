import * as argon2 from 'argon2';
import type { PrismaClient } from '../../src/generated/prisma/client';

export async function seedCore(prisma: PrismaClient) {
  console.log('  Seeding education levels and grades...');

  // Education Levels
  const primary = await prisma.educationLevel.upsert({
    where: { code: 'PRIMARY' },
    update: {},
    create: { name: 'Tiểu học', code: 'PRIMARY', displayOrder: 1 },
  });
  const secondary = await prisma.educationLevel.upsert({
    where: { code: 'SECONDARY' },
    update: {},
    create: { name: 'Trung học cơ sở', code: 'SECONDARY', displayOrder: 2 },
  });
  const highSchool = await prisma.educationLevel.upsert({
    where: { code: 'HIGH_SCHOOL' },
    update: {},
    create: { name: 'Trung học phổ thông', code: 'HIGH_SCHOOL', displayOrder: 3 },
  });

  // Grades 4-6 (Primary)
  const primaryGrades = [
    { name: 'Lớp 4', code: 'GRADE_4', displayOrder: 1, educationLevelId: primary.id },
    { name: 'Lớp 5', code: 'GRADE_5', displayOrder: 2, educationLevelId: primary.id },
  ];
  // Grades 6-9 (Secondary)
  const secondaryGrades = [
    { name: 'Lớp 6', code: 'GRADE_6', displayOrder: 1, educationLevelId: secondary.id },
    { name: 'Lớp 7', code: 'GRADE_7', displayOrder: 2, educationLevelId: secondary.id },
    { name: 'Lớp 8', code: 'GRADE_8', displayOrder: 3, educationLevelId: secondary.id },
    { name: 'Lớp 9', code: 'GRADE_9', displayOrder: 4, educationLevelId: secondary.id },
  ];
  // Grades 10-12 (High School)
  const highSchoolGrades = [
    { name: 'Lớp 10', code: 'GRADE_10', displayOrder: 1, educationLevelId: highSchool.id },
    { name: 'Lớp 11', code: 'GRADE_11', displayOrder: 2, educationLevelId: highSchool.id },
    { name: 'Lớp 12', code: 'GRADE_12', displayOrder: 3, educationLevelId: highSchool.id },
  ];

  for (const grade of [...primaryGrades, ...secondaryGrades, ...highSchoolGrades]) {
    await prisma.grade.upsert({
      where: { code: grade.code },
      update: {},
      create: grade,
    });
  }

  // Levels
  console.log('  Seeding levels...');
  const levels = [
    { name: 'Tân sinh', requiredExp: 0, displayOrder: 1 },
    { name: 'Học trò', requiredExp: 100, displayOrder: 2 },
    { name: 'Học giả', requiredExp: 250, displayOrder: 3 },
    { name: 'Hiền tài', requiredExp: 500, displayOrder: 4 },
    { name: 'Sử gia', requiredExp: 1000, displayOrder: 5 },
  ];
  for (const level of levels) {
    await prisma.level.upsert({
      where: { requiredExp: level.requiredExp },
      update: { name: level.name, displayOrder: level.displayOrder },
      create: level,
    });
  }

  // Admin account
  console.log('  Seeding admin and demo users...');
  const adminEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'admin@example.com';
  const adminPassword = process.env['SEED_ADMIN_PASSWORD'] ?? 'Admin@12345';
  const userEmail = process.env['SEED_USER_EMAIL'] ?? 'user@example.com';
  const userPassword = process.env['SEED_USER_PASSWORD'] ?? 'User@12345';

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await argon2.hash(adminPassword),
      fullName: 'Admin',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      passwordHash: await argon2.hash(userPassword),
      fullName: 'Demo User',
      role: 'USER',
    },
  });

  console.log('  ✓ Core seed done');
}
