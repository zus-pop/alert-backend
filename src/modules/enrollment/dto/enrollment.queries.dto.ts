import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
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

  @IsString()
  @IsOptional()
  @IsIn(['IN PROGRESS', 'NOT PASSED', 'PASSED'])
  @ApiProperty({
    required: false,
    type: String,
    enum: ['IN PROGRESS', 'NOT PASSED', 'PASSED'],
  })
  status?: 'IN PROGRESS' | 'NOT PASSED' | 'PASSED';
}
