import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsBooleanString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Gender } from '../../../shared/schemas/student.schema';
import { Transform } from 'class-transformer';

export class StudentQueries {
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9]{8}$/, {
    message: 'Student code must be exactly 8 alphanumeric characters',
  })
  @ApiProperty({
    required: false,
    type: String,
    pattern: '^[a-zA-Z0-9]{8}$',
    description: 'Student code must be exactly 8 alphanumeric characters',
  })
  studentCode?: string | {};

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
    description: 'First name of the student',
  })
  firstName?: string | {};

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
    description: 'Last name of the student',
  })
  lastName?: string | {};

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: Gender,
    description: 'Male or Female',
  })
  gender?: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
    description: 'Email of the student',
  })
  email?: string | {};

  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  })
  @IsOptional()
  @ApiProperty({
    required: false,
    type: Boolean,
    description: 'Indicates if the student is deleted',
  })
  isDeleted?: boolean;
}
