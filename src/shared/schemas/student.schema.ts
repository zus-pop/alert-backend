import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
  })
  deviceTokens: [string];
}

export const StudentSchema = SchemaFactory.createForClass(Student);
