import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSystemUserDto } from './create-system-user.dto';

export class UpdateSystemUserDto extends PartialType(
  OmitType(CreateSystemUserDto, ['email'] as const),
) {}
