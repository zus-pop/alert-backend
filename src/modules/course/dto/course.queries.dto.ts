import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CourseQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Filter by course title',
    required: false,
    type: String,
  })
  title?: string | {};
}
