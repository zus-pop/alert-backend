import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CurriculumQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Filter by curriculum name',
    required: false,
    type: String,
  })
  curriculumName?: string | {};

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Filter by curriculum code',
    required: false,
    type: String,
  })
  comboId?: string | Types.ObjectId;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Append with student enrollment data',
    required: false,
    type: String,
  })
  studentId?: string | Types.ObjectId;
}
