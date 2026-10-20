import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
import type { PrismaClient } from '../../src/generated/prisma/client.js';
import { Prisma } from '../../src/generated/prisma/client.js';
import { ContentJsonSchema } from '@history-learning/shared';
import { seedQuizzes } from './quizzes.js';

interface CharacterRef {
  slug: string;
  role?: string | null;
}

interface MediaRef {
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  url: string;
  title?: string | null;
  description?: string | null;
  displayOrder: number;
}

interface LessonJsonData {
  title: string;
  slug: string;
  summary?: string | null;
  thumbnail?: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedTime: number;
  displayOrder: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  grades: string[];
  topics?: string[];
  periods?: string[];
  characters?: CharacterRef[];
  events?: string[];
  media?: MediaRef[];
  blocks: any[];
}

export async function seedLessons(prisma: PrismaClient) {
  console.log('  Seeding lessons from JSON Block files...');

  const lessonsDir = path.resolve(__dirname, 'lessons');
  if (!fs.existsSync(lessonsDir)) {
    throw new Error(`Thư mục bài học không tồn tại: ${lessonsDir}`);
  }

  // 1. Fetch reference lookups for relational validation & linking
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

  const files = fs
    .readdirSync(lessonsDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const seenSlugs = new Set<string>();
  const lessonSlugToIdMap = new Map<string, string>();
  let count = 0;

  for (const filename of files) {
    const filePath = path.join(lessonsDir, filename);
    const fileSlug = path.basename(filename, '.json');

    let fileContent: string;
    try {
      fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (err: any) {
      throw new Error(`[Lỗi File: ${filename}] Không thể đọc file: ${err.message}`);
    }

    let data: LessonJsonData;
    try {
      data = JSON.parse(fileContent);
    } catch (err: any) {
      throw new Error(`[Lỗi File: ${filename}] Định dạng JSON không hợp lệ: ${err.message}`);
    }

    // 2. Validation: Required fields
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      throw new Error(`[Lỗi File: ${filename}] Thiếu trường bắt buộc "title".`);
    }

    if (!data.slug || typeof data.slug !== 'string' || !data.slug.trim()) {
      throw new Error(`[Lỗi File: ${filename}] Thiếu trường bắt buộc "slug".`);
    }

    // Tên file phải khớp với slug
    if (fileSlug !== data.slug) {
      throw new Error(
        `[Lỗi File: ${filename}] Tên file "${filename}" không khớp với trường "slug" ("${data.slug}").`,
      );
    }

    // Trùng slug
    if (seenSlugs.has(data.slug)) {
      throw new Error(
        `[Lỗi File: ${filename}] Trùng slug bài học "${data.slug}" ở trường "slug".`,
      );
    }
    seenSlugs.add(data.slug);

    if (
      !data.difficulty ||
      !['EASY', 'MEDIUM', 'HARD'].includes(data.difficulty)
    ) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "difficulty" không hợp lệ (phải là EASY, MEDIUM hoặc HARD).`,
      );
    }

    if (typeof data.estimatedTime !== 'number' || data.estimatedTime <= 0) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "estimatedTime" phải là số phút nguyên dương.`,
      );
    }

    if (typeof data.displayOrder !== 'number') {
      throw new Error(
        `[Lỗi File: ${filename}] Thiếu trường bắt buộc "displayOrder" (phải là số nguyên).`,
      );
    }

    if (
      !data.status ||
      !['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(data.status)
    ) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "status" không hợp lệ (phải là PUBLISHED, DRAFT hoặc ARCHIVED).`,
      );
    }

    if (!Array.isArray(data.grades) || data.grades.length === 0) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "grades" phải là mảng và có ít nhất 1 khối lớp.`,
      );
    }

    // 3. Validation: Validate reference slugs against existing taxonomy
    for (const gradeCode of data.grades) {
      if (!gradeMap.has(gradeCode)) {
        throw new Error(
          `[Lỗi File: ${filename}] Tham chiếu gradeCode không tồn tại: "${gradeCode}" ở trường "grades".`,
        );
      }
    }

    const topicSlugs = data.topics || [];
    for (const topicSlug of topicSlugs) {
      if (!topicMap.has(topicSlug)) {
        throw new Error(
          `[Lỗi File: ${filename}] Tham chiếu topicSlug không tồn tại: "${topicSlug}" ở trường "topics".`,
        );
      }
    }

    const periodSlugs = data.periods || [];
    for (const periodSlug of periodSlugs) {
      if (!periodMap.has(periodSlug)) {
        throw new Error(
          `[Lỗi File: ${filename}] Tham chiếu periodSlug không tồn tại: "${periodSlug}" ở trường "periods".`,
        );
      }
    }

    const charactersList = data.characters || [];
    for (const charItem of charactersList) {
      if (!charItem.slug || !characterMap.has(charItem.slug)) {
        throw new Error(
          `[Lỗi File: ${filename}] Tham chiếu characterSlug không tồn tại: "${charItem.slug}" ở trường "characters".`,
        );
      }
    }

    const eventSlugs = data.events || [];
    for (const eventSlug of eventSlugs) {
      if (!eventMap.has(eventSlug)) {
        throw new Error(
          `[Lỗi File: ${filename}] Tham chiếu eventSlug không tồn tại: "${eventSlug}" ở trường "events".`,
        );
      }
    }

    // 4. Validate Block Editor blocks array (ContentJsonSchema)
    if (!Array.isArray(data.blocks) || data.blocks.length === 0) {
      throw new Error(
        `[Lỗi File: ${filename}] Trường "blocks" phải là mảng chứa ít nhất 1 khối nội dung.`,
      );
    }

    const contentJsonObj = {
      version: 1 as const,
      blocks: data.blocks,
    };

    const blockValidation = ContentJsonSchema.safeParse(contentJsonObj);
    if (!blockValidation.success) {
      throw new Error(
        `[Lỗi File: ${filename}] Lỗi định dạng khối nội dung ở trường "blocks": ${blockValidation.error.issues.map((i) => i.message).join('; ')}`,
      );
    }

    // 5. Build HTML content from text blocks for search and AI retrieval
    const htmlParts: string[] = [];
    for (const block of data.blocks) {
      if (block.type === 'text' && typeof block.text === 'string') {
        const parsed = (await marked.parse(block.text, { breaks: true, gfm: true })).trim();
        htmlParts.push(parsed);
      }
    }
    const htmlContent = htmlParts.join('\n\n');

    // 6. Upsert Lesson with Block Editor contentJson
    const lesson = await prisma.lesson.upsert({
      where: { slug: data.slug },
      update: {
        title: data.title.trim(),
        summary: data.summary?.trim() || null,
        content: htmlContent,
        contentJson: blockValidation.data as unknown as Prisma.InputJsonValue,
        thumbnail: data.thumbnail?.trim() || null,
        difficulty: data.difficulty,
        estimatedTime: data.estimatedTime,
        displayOrder: data.displayOrder,
        status: data.status,
      },
      create: {
        title: data.title.trim(),
        slug: data.slug.trim(),
        summary: data.summary?.trim() || null,
        content: htmlContent,
        contentJson: blockValidation.data as unknown as Prisma.InputJsonValue,
        thumbnail: data.thumbnail?.trim() || null,
        difficulty: data.difficulty,
        estimatedTime: data.estimatedTime,
        displayOrder: data.displayOrder,
        status: data.status,
      },
    });

    lessonSlugToIdMap.set(lesson.slug, lesson.id);

    // 7. Clear old relational links and reconnect (safe and idempotent)
    await prisma.lessonGrade.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonTopic.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonPeriod.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonCharacter.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonEvent.deleteMany({ where: { lessonId: lesson.id } });
    await prisma.lessonMedia.deleteMany({ where: { lessonId: lesson.id } });

    // Connect Grades
    for (const code of data.grades) {
      const gradeId = gradeMap.get(code)!;
      await prisma.lessonGrade.create({
        data: { lessonId: lesson.id, gradeId },
      });
    }

    // Connect Topics
    for (const slug of topicSlugs) {
      const topicId = topicMap.get(slug)!;
      await prisma.lessonTopic.create({
        data: { lessonId: lesson.id, topicId },
      });
    }

    // Connect Periods
    for (const slug of periodSlugs) {
      const periodId = periodMap.get(slug)!;
      await prisma.lessonPeriod.create({
        data: { lessonId: lesson.id, periodId },
      });
    }

    // Connect Characters (with role)
    for (const charItem of charactersList) {
      const characterId = characterMap.get(charItem.slug)!;
      await prisma.lessonCharacter.create({
        data: {
          lessonId: lesson.id,
          characterId,
          role: charItem.role?.trim() || null,
        },
      });
    }

    // Connect Events
    for (const slug of eventSlugs) {
      const eventId = eventMap.get(slug)!;
      await prisma.lessonEvent.create({
        data: { lessonId: lesson.id, eventId },
      });
    }

    // Add Media items
    const mediaList = data.media || [];
    for (const mediaItem of mediaList) {
      await prisma.lessonMedia.create({
        data: {
          lessonId: lesson.id,
          type: mediaItem.type,
          url: mediaItem.url.trim(),
          title: mediaItem.title?.trim() || null,
          description: mediaItem.description?.trim() || null,
          displayOrder: mediaItem.displayOrder,
        },
      });
    }

    count++;
  }

  console.log(`  ✓ Seeded ${count} lessons successfully`);

  // 8. Seed quizzes from JSON files
  await seedQuizzes(prisma, lessonSlugToIdMap);
}
