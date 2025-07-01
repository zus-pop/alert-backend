import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEnrollmentDto } from './create-enrollment.dto';

export class UpdateEnrollmentDto extends PartialType(
  OmitType(CreateEnrollmentDto, ['courseId', 'studentId'] as const),
) {}
