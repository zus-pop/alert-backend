import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SortCriteria {
  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc', 'ascending', 'descending'])
  @ApiProperty({
    required: false,
    enum: ['asc', 'desc', 'ascending', 'descending'],
    description: 'Sort order for the results',
  })
  order?: 'asc' | 'desc' | 'ascending' | 'descending' = 'desc';
}
