import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { AdminEventsController } from './admin-events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
