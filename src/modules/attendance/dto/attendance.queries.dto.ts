import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AttendanceQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  enrollmentId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  sessionId?: string;
}
