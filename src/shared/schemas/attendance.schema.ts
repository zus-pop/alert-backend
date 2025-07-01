import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Enrollment } from './enrollment.schema';
import { Session } from './session.schema';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({
  collection: 'attendance',
  timestamps: true,
})
export class Attendance {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Enrollment',
  })
  enrollmentId: Enrollment;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Session',
  })
  sessionId: Session;

  @Prop({
    required: true,
    default: 'Not Yet',
  })
  status: 'Not Yet' | 'Attended' | 'Absent';
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
