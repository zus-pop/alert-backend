import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../shared/schemas';
import { IsOptional, IsString } from 'class-validator';

export class SystemUserQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  firstName?: string | {};

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  lastName?: string | {};

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: ['ADMIN', 'MANAGER', 'STAFF'],
  })
  role?: Role;
}
