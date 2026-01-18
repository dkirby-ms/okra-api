import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { Objective } from '../objectives/entities/objective.entity.js';
import { KeyResult } from '../key-results/entities/key-result.entity.js';

/**
 * Module for Reports feature (US3 - View OKR Progress Reports).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Objective, KeyResult])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
