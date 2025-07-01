import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAttendanceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the enrollment associated with the attendance',
    required: true,
    type: String,
  })
  enrollmentId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID of the session associated with the attendance',
    required: true,
    type: String,
  })
  sessionId: string;
}
