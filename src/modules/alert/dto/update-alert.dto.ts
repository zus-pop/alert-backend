import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAlertDto } from './create-alert.dto';

export class UpdateAlertDto extends PartialType(
  OmitType(CreateAlertDto, ['enrollmentId', 'title', 'content'] as const),
) {}
