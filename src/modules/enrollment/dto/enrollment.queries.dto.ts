import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class EnrollmentQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  studentId?: Types.ObjectId | string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  courseId?: string;
}
