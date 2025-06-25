import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  semesterId: string;
}
