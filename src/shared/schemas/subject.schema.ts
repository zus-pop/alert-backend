import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SubjectDocument = HydratedDocument<Subject>;

@Schema({
  collection: 'subject',
  timestamps: true,
})
export class Subject {
  @Prop({
    required: true,
    unique: true,
  })
  subjectCode: string;
  @Prop({
    required: true,
  })
  subjectName: string;

  @Prop({
    type: [Types.ObjectId],
    ref: 'Subject',
    required: true,
  })
  prerequisite: Subject[] | Types.ObjectId[];
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
