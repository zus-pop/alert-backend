import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProfileDto {
  @IsOptional()
  @ApiProperty({
    type: String,
    format: 'binary',
    required: false,
  })
  image?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  lastName?: string;
}
