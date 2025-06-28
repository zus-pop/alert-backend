import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '../../../shared/schemas';

export class CreateStudentDto {
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
