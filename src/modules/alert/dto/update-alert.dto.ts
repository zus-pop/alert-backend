import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateAlertDto } from './create-alert.dto';
import { IsBooleanString, IsOptional } from 'class-validator';

export class UpdateAlertDto extends PartialType(
  OmitType(CreateAlertDto, ['enrollmentId', 'title', 'content'] as const),
) {
  @IsOptional()
  @IsBooleanString()
  @ApiProperty({
    description: 'Indicates whether the alert has been read or not',
    required: false,
    type: Boolean,
    default: false,
  })
  isRead?: boolean;
}
