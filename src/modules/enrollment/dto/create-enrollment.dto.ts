import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

class Grade {
  @ApiProperty()
  type: string;

  @ApiProperty()
  score: number;

  @ApiProperty()
  weight: number;
}

export class CreateEnrollmentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'ID of the course to enroll in',
  })
  courseId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    description: 'ID of the student enrolling in the course',
  })
  studentId: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    isArray: true,
    type: Grade,
  })
  grade: Grade[];
}
