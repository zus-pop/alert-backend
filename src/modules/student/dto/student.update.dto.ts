import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  firstName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  lastName?: string;

  @IsString()
  @IsOptional()
  @IsIn(['Male', 'Female'])
  @ApiProperty()
  gender?: 'Male' | 'Female';

  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
