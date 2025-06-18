import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SemesterQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  semesterName?: string | {};

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    type: Date,
    required: false,
  })
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    type: Date,
    required: false,
  })
  endDate?: Date;
}
