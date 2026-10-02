import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { AdminTopicsController } from './admin-topics.controller';
import { TopicsService } from './topics.service';

@Module({
  controllers: [TopicsController, AdminTopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
