import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Course } from './course.schema';
import { Student, StudentDocument } from './student.schema';

export type EnrollmentDocument = HydratedDocument<Enrollment>;
export type GradeDocument = HydratedDocument<Grade>;

@Schema({
  _id: false,
})
class Grade {
  @Prop({
    required: true,
    type: String,
    enum: ['progress test', 'assignment', 'practical exam', 'final exam'],
  })
  type: 'progress test' | 'assignment' | 'practical exam' | 'final exam';
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
  courseId: Types.ObjectId | Course;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Student',
  })
  studentId: StudentDocument | Types.ObjectId;

  @Prop({
    required: true,
    default: Date.now,
  })
  enrollmentDate: Date;

  @Prop({
    required: true,
  })
  grade: [Grade];

  @Prop({
    required: false,
    type: Number,
  })
  finalGrade?: number;

  @Prop({
    required: true,
    enum: EnrollmentStatus,
    default: 'IN PROGRESS',
    type: String,
  })
  status: 'IN PROGRESS' | 'NOT PASSED' | 'PASSED';
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
