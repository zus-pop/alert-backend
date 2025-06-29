import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class Pagination {
  @IsNumberString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
  })
  page?: number;

  @IsNumberString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Number of items per page',
  })
  limit?: number;
}
