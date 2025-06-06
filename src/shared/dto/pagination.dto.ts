import { ApiProperty } from '@nestjs/swagger';
import {
    IsNumberString,
    IsOptional
} from 'class-validator';

export class Pagination {
  @IsNumberString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  page?: number;

  @IsNumberString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  limit?: number;
}
