import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  IdParamSchema,
  type IdParamDto,
  AttemptIdParamSchema,
  type AttemptIdParamDto,
  SubmitQuizSchema,
  type SubmitQuizDto,
  StudentQuizListQuerySchema,
  type StudentQuizListQueryDto,
} from '@history-learning/shared';
import { CurrentUser } from '../common/decorators/current-user';
import type { User } from '../generated/prisma/client';
import { QuizzesService } from './quizzes.service';

@ApiTags('Quizzes')
@ApiBearerAuth()
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Get()
  @ApiOperation({
    summary: 'List available quizzes for student',
    description:
      'Returns published quizzes with status LOCKED, AVAILABLE, or DONE. Defaults to user grade or ?gradeId.',
  })
  async findAll(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(StudentQuizListQuerySchema)) query: StudentQuizListQueryDto,
  ) {
    return this.quizzesService.findStudentQuizzes(user.id, user.role, query.gradeId);
  }

  @Post(':id/start')
  @ApiOperation({
    summary: 'Start or reuse an open quiz attempt',
    description:
      'Creates a new attempt or reuses an existing unexpired attempt. Returns questions without answers.',
  })
  async startQuiz(
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.quizzesService.startQuiz(user.id, user.role, id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit a quiz attempt for grading',
    description: 'Grades the attempt on server. Idempotent on repeated submissions.',
  })
  async submitQuiz(
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
    @Body(new ZodValidationPipe(SubmitQuizSchema)) dto: SubmitQuizDto,
  ) {
    return this.quizzesService.submitQuiz(user.id, id, dto);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({
    summary: 'Get attempt review with explanations',
    description: 'Only accessible by the attempt owner and only after submission.',
  })
  async getAttemptReview(
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(AttemptIdParamSchema)) { attemptId }: AttemptIdParamDto,
  ) {
    return this.quizzesService.getAttemptReview(user.id, attemptId);
  }
}
