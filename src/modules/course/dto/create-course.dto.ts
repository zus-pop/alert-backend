import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  semesterId: string;

  @IsOptional()
  @ApiProperty({
    type: String,
    format: 'binary',
    required: false,
  })
  image?: string;
}
