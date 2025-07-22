import { Types } from 'mongoose';

export class AbsenteeismRate {
  constructor(
    readonly studentId: Types.ObjectId,
    readonly alertId: Types.ObjectId,
    readonly title: string,
    readonly content: string,
  ) {}
}
