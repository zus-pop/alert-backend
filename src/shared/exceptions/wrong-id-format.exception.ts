import { BadRequestException } from '@nestjs/common';

export class WrongIdFormatException extends BadRequestException {
  constructor(message?: string) {
    super(message ?? 'Id is wrong format');
  }
}
