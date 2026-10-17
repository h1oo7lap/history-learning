import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { IdParamSchema, type IdParamDto } from '@history-learning/shared';
import { CurrentUser } from '../common/decorators/current-user';
import type { User } from '../generated/prisma/client';
import { ProgressService } from './progress.service';

@ApiTags('Progress')
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('lessons/:id/start')
  @ApiOperation({
    summary: 'Start a lesson (sets status to IN_PROGRESS)',
    description:
      'Creates or maintains IN_PROGRESS status for the authenticated user. Never downgrades COMPLETED status.',
  })
  async startLesson(
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.progressService.startLesson(user.id, id);
  }

  @Post('lessons/:id/complete')
  @ApiOperation({
    summary: 'Complete a lesson (sets status to COMPLETED)',
    description:
      'Sets lesson progress to COMPLETED (100%). completedAt is recorded on first completion; repeated calls return the same result.',
  })
  async completeLesson(
    @CurrentUser() user: User,
    @Param(new ZodValidationPipe(IdParamSchema)) { id }: IdParamDto,
  ) {
    return this.progressService.completeLesson(user.id, id);
  }

  @Get('progress/me')
  @ApiOperation({
    summary: 'Get current user lesson progress list',
    description:
      'Returns a list of all lesson progress records for the authenticated user (lessonId, status, progress, startedAt, completedAt).',
  })
  async getMyProgress(@CurrentUser() user: User) {
    return this.progressService.getMyProgress(user.id);
  }
}
