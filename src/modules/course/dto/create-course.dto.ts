import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  subjectId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  semesterId: string | Types.ObjectId;

  @IsOptional()
  @ApiProperty({
    type: String,
    format: 'binary',
    required: false,
  })
  image?: string;
}
