import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalysisConsumer } from './consumer';
import { AnalysisProducer } from './producer';
import { ANALYSIS_QUEUE } from '../../shared/constant';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: ANALYSIS_QUEUE,
    }),
    StudentModule,
  ],
  controllers: [],
  providers: [AnalysisConsumer, AnalysisProducer],
})
export class QueueModule {}
