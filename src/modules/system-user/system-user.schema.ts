import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SystemUserDocument = HydratedDocument<SystemUser>;

export enum Role {
  ADMIN,
  MANAGER,
  SUPERVISOR,
}

@Schema({
  collection: 'systemUser',
  timestamps: true,
})
export class SystemUser {
  @Prop({
    required: true,
  })
  email: string;
  @Prop({
    required: true,
  })
  firstName: string;
  @Prop({
    required: true,
  })
  lastName: string;
  @Prop({
    required: true,
  })
  password: string;
  @Prop({
    enum: Role,
    required: true,
  })
  role: string;
}

export const SystemUserSchema = SchemaFactory.createForClass(SystemUser);
