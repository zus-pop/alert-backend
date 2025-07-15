import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Major } from './major.schema';

export type ComboDocument = HydratedDocument<Combo>;

@Schema({
  collection: 'combo',
  timestamps: true,
})
export class Combo {
  @Prop({
    required: true,
    unique: true,
  })
  comboCode: string;
  @Prop({
    required: true,
  })
  comboName: string;

  @Prop({
    required: false,
  })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Major',
  })
  majorId: Major | Types.ObjectId;
}

export const ComboSchema = SchemaFactory.createForClass(Combo);
