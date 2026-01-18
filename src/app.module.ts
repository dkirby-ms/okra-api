import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { envValidationSchema } from './config/env.validation.js';
import databaseConfig from './config/database.config.js';
import { ObjectivesModule } from './objectives/objectives.module.js';
import { TimePeriodsModule } from './time-periods/time-periods.module.js';
import { KeyResultsModule } from './key-results/key-results.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [databaseConfig],
    }),
    // TypeORM with async configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        migrationsRun: configService.get<string>('NODE_ENV') !== 'development',
        migrationsTableName: 'migrations',
        logging:
          configService.get<string>('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
      }),
      inject: [ConfigService],
    }),
    // Feature modules
    ObjectivesModule,
    TimePeriodsModule,
    KeyResultsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
