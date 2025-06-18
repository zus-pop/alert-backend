import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Subject } from './subject.schema';
import { Semester } from './semester.schema';

export type CourseDocument = HydratedDocument<Course>;

@Schema({
  collection: 'course',
  timestamps: true,
})
export class Course {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Subject',
  })
  subjectId: Subject;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Semester',
  })
  semesterId: Semester;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
