import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  subjectCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  subjectName: string;
}
