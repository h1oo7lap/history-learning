import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  LessonListQuerySchema,
  type LessonListQueryDto,
  SlugParamSchema,
  type SlugParamDto,
} from '@history-learning/shared';
import { Public } from '../common/decorators/public';
import { LessonsService } from './lessons.service';

@ApiTags('Lessons')
@Public()
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({
    summary: 'List published lessons (public)',
    description:
      'Returns paginated list of PUBLISHED lessons. Supports filtering by grade, topic, period, and difficulty.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'gradeId', required: false, type: String })
  @ApiQuery({ name: 'topicId', required: false, type: String })
  @ApiQuery({ name: 'periodId', required: false, type: String })
  @ApiQuery({ name: 'difficulty', required: false, type: String })
  async findAll(
    @Query(new ZodValidationPipe(LessonListQuerySchema))
    query: LessonListQueryDto,
  ) {
    return this.lessonsService.findAllPublic(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single published lesson by slug (public)',
  })
  async findOne(
    @Param(new ZodValidationPipe(SlugParamSchema)) { slug }: SlugParamDto,
  ) {
    return this.lessonsService.findOneBySlug(slug);
  }
}
