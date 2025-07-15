import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
  })
  comboId?: string;
}
