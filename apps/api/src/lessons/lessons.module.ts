import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { AdminLessonsController } from './admin-lessons.controller';
import { LessonsService } from './lessons.service';

@Module({
  controllers: [LessonsController, AdminLessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
