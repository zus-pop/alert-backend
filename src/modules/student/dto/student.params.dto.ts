import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Gender } from '../student.schema';

export class StudentParams {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  _id?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  firstName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  lastName?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: Gender,
  })
  gender?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
  })
  email?: string;
}
