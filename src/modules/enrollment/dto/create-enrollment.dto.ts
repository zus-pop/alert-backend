import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsString } from 'class-validator';

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
  courseId: string;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsDateString()
  @IsNotEmpty()
  enrollmentDate: Date;

  @IsArray()
  @ApiProperty({
    isArray: true,
    type: Grade,
  })
  grade: Grade[];
}
