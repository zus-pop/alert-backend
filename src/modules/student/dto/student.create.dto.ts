import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Gender } from '../../../shared/schemas';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    type: String,
    pattern: '^[a-zA-Z0-9]{8}$',
  })
  @Matches(/^[a-zA-Z0-9]{8}$/, {
    message: 'Student code must be exactly 8 alphanumeric characters',
  })
  studentCode: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    enum: Gender,
    description: 'Female or Male',
  })
  @IsIn(['Male', 'Female'])
  gender?: 'Male' | 'Female';

  @IsEmail()
  @IsOptional()
  @ApiProperty()
  email: string;

  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
