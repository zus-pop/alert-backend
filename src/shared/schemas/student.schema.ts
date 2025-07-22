import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Major } from './major.schema';
import { Combo } from './combo.schema';
import { Curriculum } from './curriculum.schema';

export type StudentDocument = HydratedDocument<Student>;

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

@Schema({
  collection: 'student',
  timestamps: true,
})
export class Student {
  @Prop({
    required: true,
    unique: true,
    type: String,
    match: /^[a-zA-Z0-9]{8}$/,
  })
  studentCode: string;

  @Prop({
    required: true,
  })
  firstName: string;
  @Prop({
    required: true,
  })
  @Prop({
    required: true,
  })
  lastName: string;

  @Prop({
    required: false,
  })
  image: string;

  @Prop({
    required: true,
    unique: true,
  })
  email: string;
  @Prop({
    enum: Gender,
  })
  gender: string;

  @Prop({
    required: false,
  })
  password: string;

  @Prop({
    required: false,
    type: [String],
  })
  deviceTokens: string[];

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Major',
  })
  majorId: Major;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Combo',
  })
  comboId: Combo;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Curriculum',
  })
  curriculumId: Curriculum;

  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  learnedSemester: number;

  @Prop({
    required: false,
    default: false,
  })
  isDeleted?: boolean;

  @Prop({
    required: false,
    default: null,
  })
  deletedAt?: Date;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
