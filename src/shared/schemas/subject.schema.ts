import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
