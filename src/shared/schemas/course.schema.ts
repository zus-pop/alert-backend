import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Subject, SubjectDocument } from './subject.schema';
import { Semester, SemesterDocument } from './semester.schema';

export type CourseDocument = HydratedDocument<Course>;

@Schema({
  collection: 'course',
  timestamps: true,
})
export class Course {
  @Prop({
    required: true,
    type: String,
  })
  title: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Subject',
  })
  subjectId: SubjectDocument;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Semester',
  })
  semesterId: SemesterDocument;

  @Prop({
    type: String,
    required: false,
  })
  image?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
