import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Enrollment } from './enrollment.schema';

export type AlertDocument = HydratedDocument<Alert>;

@Schema({
  timestamps: true,
})
class SupervisorResponse {
  @Prop({
    required: true,
  })
  response: string;
  @Prop({
    required: false,
  })
  plan: string;
}

@Schema({
  collection: 'alert',
  timestamps: true,
})
export class Alert {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Enrollment',
  })
  enrollmentId: Enrollment;

  @Prop({
    required: true,
    type: String,
  })
  title: string;

  @Prop({
    required: true,
    type: String,
  })
  content: string;

  @Prop({
    required: false,
  })
  supervisorResponse?: SupervisorResponse;

  @Prop({
    required: true,
    type: String,
    enum: ['RESPONDED', 'NOT RESPONDED'],
    default: 'NOT RESPONDED',
  })
  status: 'RESPONDED' | 'NOT RESPONDED';

  @Prop({
    required: false,
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Prop({
    required: false,
    type: Boolean,
    default: false,
  })
  isRead: boolean;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
