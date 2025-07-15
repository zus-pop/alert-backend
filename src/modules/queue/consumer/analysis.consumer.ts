import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ANALYSIS_QUEUE } from '../../../shared/constant';
import { AiService } from '../../ai/ai.service';
import { AlertService } from '../../alert/alert.service';

@Processor(ANALYSIS_QUEUE)
export class AnalysisConsumer extends WorkerHost {
  private readonly logger: Logger = new Logger(AnalysisConsumer.name);

  constructor(
    private readonly aiService: AiService,
    private readonly alertService: AlertService,
  ) {
    super();
  }

  async process(job: Job) {
    const response = await this.aiService.analysis(
      {
        question: 'Please analyze the enrollment data and provide insights.',
      },
      job.data.enrollmentInfo,
    );

    if (response.shouldGetAlert) {
      this.logger.log(`Alert triggered`);
      await this.alertService.create({
        enrollmentId: response.enrollmentId,
        content: response.content,
        title: response.title,
        riskLevel: response.riskLevel,
      });
    }
  }
}
