import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { AdminQuizzesController } from './admin-quizzes.controller';
import { QuizzesController } from './quizzes.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [AdminQuizzesController, QuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
