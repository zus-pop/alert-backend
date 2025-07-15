import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class AttendanceQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  enrollmentId?: string | Types.ObjectId;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  sessionId?: string | Types.ObjectId;
}
