import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyResultsController } from './key-results.controller.js';
import { KeyResultsService } from './key-results.service.js';
import { KeyResult } from './entities/key-result.entity.js';
import { Objective } from '../objectives/entities/objective.entity.js';

/**
 * Module for Key Results feature (US2 - Define and Track Key Results).
 */
@Module({
  imports: [TypeOrmModule.forFeature([KeyResult, Objective])],
  controllers: [KeyResultsController],
  providers: [KeyResultsService],
  exports: [KeyResultsService],
})
export class KeyResultsModule {}
