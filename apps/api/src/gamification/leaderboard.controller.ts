import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  LeaderboardQuerySchema,
  type LeaderboardQueryDto,
} from '@history-learning/shared';
import { Public } from '../common/decorators/public';
import { CurrentUser } from '../common/decorators/current-user';
import type { User } from '../generated/prisma/client';
import { GamificationService } from './gamification.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get EXP leaderboard for a specific grade or current user grade',
    description:
      'Returns top 10 users with highest EXP in the target grade and current user ranking. If gradeId is not provided, defaults to current user grade or the first active grade.',
  })
  async getLeaderboard(
    @CurrentUser() user?: User,
    @Query(new ZodValidationPipe(LeaderboardQuerySchema)) query?: LeaderboardQueryDto,
  ) {
    return this.gamificationService.getLeaderboard(query?.gradeId, user?.id);
  }
}

