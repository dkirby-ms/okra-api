import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimePeriod } from './entities/time-period.entity.js';
import { TimePeriodsService } from './time-periods.service.js';
import { TimePeriodsController } from './time-periods.controller.js';

/**
 * Module for Time Periods feature.
 * Time periods define planning cycles (quarters, years) for OKRs.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TimePeriod])],
  controllers: [TimePeriodsController],
  providers: [TimePeriodsService],
  exports: [TimePeriodsService],
})
export class TimePeriodsModule {}
