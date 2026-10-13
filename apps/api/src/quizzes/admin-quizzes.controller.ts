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
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateQuizSchema,
  type CreateQuizDto,
  UpdateQuizSchema,
  type UpdateQuizDto,
  QuestionSchema,
  IdParamSchema,
  type IdParamDto,
  QUIZ,
} from '@history-learning/shared';
import { z } from 'zod';
import { Roles } from '../common/decorators/roles';
import { QuizzesService } from './quizzes.service';

const SetQuestionsSchema = z.object({
  questions: z
    .array(QuestionSchema)
    .min(QUIZ.QUESTIONS_MIN)
    .max(QUIZ.QUESTIONS_MAX),
});
type SetQuestionsDto = z.infer<typeof SetQuestionsSchema>;

@ApiTags('Admin / Quizzes')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/quizzes')
export class AdminQuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list all quizzes (any status, paginated)' })
  async findAll(@Query() query: Record<string, string>) {
    return this.quizzesService.adminFindAll({
      page: query['page'] ? Number(query['page']) : undefined,
      pageSize: query['pageSize'] ? Number(query['pageSize']) : undefined,
      search: query['search'],
      status: query['status'],
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get quiz by ID (with questions + answers)' })
  async findOne(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.quizzesService.adminFindOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create quiz (linked to a lesson)' })
  async create(
    @Body(new ZodValidationPipe(CreateQuizSchema)) dto: CreateQuizDto,
  ) {
    return this.quizzesService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update quiz metadata' })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(UpdateQuizSchema)) dto: UpdateQuizDto,
  ) {
    return this.quizzesService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin: delete quiz (hard delete)' })
  async remove(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    await this.quizzesService.adminDelete(id);
  }

  @Put(':id/questions')
  @ApiOperation({ summary: 'Admin: atomically replace all questions for a quiz' })
  async setQuestions(
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(SetQuestionsSchema)) body: SetQuestionsDto,
  ) {
    return this.quizzesService.adminSetQuestions(id, body.questions);
  }
}
