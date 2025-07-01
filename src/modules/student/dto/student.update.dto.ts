import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: true,
    type: String,
    pattern: '^[a-zA-Z0-9]{8}$',
    description: 'Student code must be exactly 8 alphanumeric characters',
  })
  @Matches(/^[a-zA-Z0-9]{8}$/, {
    message: 'Student code must be exactly 8 alphanumeric characters',
  })
  studentCode?: string;

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
