import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Combo } from './combo.schema';

export type CurriculumDocument = HydratedDocument<Curriculum>;

@Schema({
  collection: 'curriculum',
  timestamps: true,
})
export class Curriculum {
  @Prop({
    required: true,
  })
  curriculumName: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Combo',
    required: true,
  })
  comboId: Combo | Types.ObjectId;
}

export const CurriculumSchema = SchemaFactory.createForClass(Curriculum);
