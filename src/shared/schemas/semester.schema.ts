import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SemesterDocument = HydratedDocument<Semester>;

@Schema({
  collection: 'semester',
  timestamps: true,
})
export class Semester {
  @Prop({
    required: true,
  })
  semesterName: string;
  @Prop({
    required: true,
  })
  startDate: Date;
  @Prop({
    required: true,
  })
  endDate: Date;
}

export const SemesterSchema = SchemaFactory.createForClass(Semester);
