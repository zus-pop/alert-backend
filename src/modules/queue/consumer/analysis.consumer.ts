import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ANALYSIS_QUEUE } from '../../../shared/constant';

// @Processor(ANALYSIS_QUEUE)
export class AnalysisConsumer extends WorkerHost {
  private readonly logger: Logger = new Logger(AnalysisConsumer.name);

  async process(job: Job) {
    console.log(job.data);
    // await new Promise((resolve) => setTimeout(resolve, 30000)); // Simulate a delay
  }
}
