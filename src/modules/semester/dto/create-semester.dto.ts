import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateSemesterDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  semesterName: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  startDate: Date;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  endDate: Date;
}
