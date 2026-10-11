import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  LessonListQuerySchema,
  type LessonListQueryDto,
  CreateLessonSchema,
  type CreateLessonDto,
  UpdateLessonSchema,
  type UpdateLessonDto,
  IdParamSchema,
  type IdParamDto,
} from '@history-learning/shared';
import { Roles } from '../common/decorators/roles';
import { LessonsService } from './lessons.service';

@ApiTags('Admin / Lessons')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/lessons')
export class AdminLessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all lessons (any status)' })
  async findAll(
    @Query(new ZodValidationPipe(LessonListQuerySchema))
    query: LessonListQueryDto,
  ) {
    return this.lessonsService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get lesson by ID (with all relations)' })
  async findOne(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.lessonsService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create lesson' })
  async create(
    @Body(new ZodValidationPipe(CreateLessonSchema)) dto: CreateLessonDto,
  ) {
    return this.lessonsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update lesson' })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(UpdateLessonSchema)) dto: UpdateLessonDto,
  ) {
    return this.lessonsService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: archive lesson (set ARCHIVED)' })
  async remove(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    await this.lessonsService.adminDelete(id);
  }
}
