import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from '../../shared/schemas';
import { AttendanceModule } from '../attendance/attendance.module';
import { SessionModule } from '../session/session.module';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
    ]),
    AttendanceModule,
    SessionModule,
  ],
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
