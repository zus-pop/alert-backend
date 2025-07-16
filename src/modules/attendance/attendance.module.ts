import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Attendance,
  AttendanceSchema,
  Enrollment,
  EnrollmentSchema,
} from '../../shared/schemas';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { EnrollmentModule } from '../enrollment/enrollment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Attendance.name,
        schema: AttendanceSchema,
      },
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
    ]),
    forwardRef(() => EnrollmentModule),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
