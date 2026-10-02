import { Module } from '@nestjs/common';
import { PeriodsController } from './periods.controller';
import { AdminPeriodsController } from './admin-periods.controller';
import { PeriodsService } from './periods.service';

@Module({
  controllers: [PeriodsController, AdminPeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}
