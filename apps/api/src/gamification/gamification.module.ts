import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  controllers: [LeaderboardController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
