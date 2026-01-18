import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObjectivesController } from './objectives.controller.js';
import { ObjectivesKeyResultsController } from './objectives-key-results.controller.js';
import { ObjectivesService } from './objectives.service.js';
import { Objective } from './entities/objective.entity.js';
import { KeyResult } from '../key-results/entities/key-result.entity.js';
import { KeyResultsModule } from '../key-results/key-results.module.js';

/**
 * Module for Objectives feature (US1 - Create and Manage Objectives).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Objective, KeyResult]), forwardRef(() => KeyResultsModule)],
  controllers: [ObjectivesController, ObjectivesKeyResultsController],
  providers: [ObjectivesService],
  exports: [ObjectivesService],
})
export class ObjectivesModule {}
