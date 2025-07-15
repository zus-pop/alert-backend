import { InjectQueue } from '@nestjs/bullmq';
import { ANALYSIS_QUEUE } from '../../../shared/constant';
import { Queue } from 'bullmq';
import { StudentService } from '../../student/student.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

export class AnalysisProducer {
  private readonly logger: Logger = new Logger(AnalysisProducer.name);
  constructor(
    @InjectQueue(ANALYSIS_QUEUE) private analysisQueue: Queue,
    private studentService: StudentService,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async retrieveEnrollmentInfo() {
    const studentIds = await this.studentService.getAllStudentIds();
    const enrollmentInfo = await Promise.all(
      studentIds.map(async (id) =>
        this.studentService.retrieveStudentDataById(id._id.toString()),
      ),
    );
    enrollmentInfo.forEach((info) => {
      if (info.enrollments.length > 0) {
        this.logger.log(
          `Adding enrollment info for student ${info.studentInfo._id} to the analysis queue`,
        );
        this.analysisQueue.add(
          ANALYSIS_QUEUE,
          {
            enrollmentInfo: JSON.stringify(
              info.enrollments.filter((e) => e.status !== 'PASSED'),
            ),
          },
          {
            removeOnComplete: true,
            removeOnFail: true,
          },
        );
      }
    });
  }
}
