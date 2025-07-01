import { Types } from "mongoose";

export class RespondedAlertEvent {
  constructor(
    readonly studentId: Types.ObjectId,
    readonly title: string,
    readonly content: string,
    readonly supervisorResponse?: {
      response: string;
      plan?: string;
    },
  ) {}
}
