import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Course } from './course.schema';

export type SessionDocument = HydratedDocument<Session>;

@Schema({
  collection: 'session',
  timestamps: true,
})
export class Session {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Course',
  })
  courseId: Course;

  @Prop({
    required: true,
  })
  title: string;

  @Prop({
    required: true,
  })
  startTime: Date;

  @Prop({
    required: true,
  })
  endTime: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
