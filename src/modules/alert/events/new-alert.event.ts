import { Types } from 'mongoose';

export class NewAlertEvent {
  constructor(
    readonly studentId: Types.ObjectId,
    readonly title: string,
    readonly content: string,
  ) {}
}
