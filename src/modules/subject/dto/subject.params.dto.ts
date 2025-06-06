import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubjectQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  subjectCode?: string;
  
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  subjectName?: string;
}
