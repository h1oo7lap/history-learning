import { Module } from '@nestjs/common';
import { QuizzesService } from './quizzes.service';
import { AdminQuizzesController } from './admin-quizzes.controller';

@Module({
  controllers: [AdminQuizzesController],
  providers: [QuizzesService],
  exports: [QuizzesService],
})
export class QuizzesModule {}
