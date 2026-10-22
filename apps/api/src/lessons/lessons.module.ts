import { Module, forwardRef } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { AdminLessonsController } from './admin-lessons.controller';
import { LessonsService } from './lessons.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [LessonsController, AdminLessonsController],
  providers: [LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
