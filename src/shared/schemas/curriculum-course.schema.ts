import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Curriculum } from './curriculum.schema';
import { Subject } from './subject.schema';

export type CurriculumCourseDocument = HydratedDocument<CurriculumCourse>;

@Schema({
  collection: 'curriculumCourse',
  timestamps: true,
})
export class CurriculumCourse {
  @Prop({
    type: Types.ObjectId,
    ref: 'Curriculum',
    required: true,
  })
  curriculumId: Curriculum | Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Subject',
    required: true,
  })
  subjectId: Subject | Types.ObjectId;

  @Prop({
    required: true,
    type: Number,
  })
  semesterNumber: number;
}

export const CurriculumCourseSchema =
  SchemaFactory.createForClass(CurriculumCourse);
