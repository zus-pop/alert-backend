import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Course } from './course.schema';
import { StudentDocument } from './student.schema';

export type EnrollmentDocument = HydratedDocument<Enrollment>;
export type GradeDocument = HydratedDocument<Grade>;

@Schema({
  _id: false,
})
class Grade {
  @Prop({})
  type: string;
  @Prop({})
  score: number;
  @Prop({})
  weight: number;
}

export enum EnrollmentStatus {
  IN_PROGRESS = 'IN PROGRESS',
  NOT_PASSED = 'NOT PASSED',
  PASSED = 'PASSED',
}

@Schema({
  collection: 'enrollment',
  timestamps: true,
})
export class Enrollment {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Course',
  })
  courseId: Course;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Student',
  })
  studentId: StudentDocument;

  @Prop({
    required: true,
  })
  enrollmentDate: Date;

  @Prop({
    required: true,
  })
  grade: [Grade];

  @Prop({
    required: true,
    enum: EnrollmentStatus,
  })
  status: string;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
