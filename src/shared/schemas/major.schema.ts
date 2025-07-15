import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MajorDocument = HydratedDocument<Major>;

@Schema({
  collection: 'major',
  timestamps: true,
})
export class Major {
  @Prop({
    required: true,
    unique: true,
  })
  majorCode: string;
  @Prop({
    required: true,
  })
  majorName: string;
}

export const MajorSchema = SchemaFactory.createForClass(Major);
