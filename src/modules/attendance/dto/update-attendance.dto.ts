import { ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateAttendanceDto extends OmitType(CreateAttendanceDto, [
  'enrollmentId',
  'sessionId',
]) {
  @IsString()
  @IsNotEmpty()
  @IsIn(['ATTENDED', 'ABSENT', 'NOT YET'])
  @ApiProperty({
    description: 'Status of the attendance',
    enum: ['ATTENDED', 'ABSENT', 'NOT YET'],
    example: 'ATTENDED',
  })
  status: 'ATTENDED' | 'ABSENT' | 'NOT YET';
}
