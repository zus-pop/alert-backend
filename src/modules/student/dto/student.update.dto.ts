import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateStudentDto {
  //   @IsString()
  //   @IsOptional()
  //   @ApiProperty({
  //     required: false,
  //     type: String,
  //     pattern: '^[a-zA-Z0-9]{8}$',
  //     description: 'Student code must be exactly 8 alphanumeric characters',
  //   })
  //   @Matches(/^[a-zA-Z0-9]{8}$/, {
  //     message: 'Student code must be exactly 8 alphanumeric characters',
  //   })
  //   studentCode?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'ID of the major the student belongs to',
  })
  majorId?: string | Types.ObjectId;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'ID of the combo the student belongs to',
  })
  comboId?: string | Types.ObjectId;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'ID of the curriculum the student belongs to',
  })
  curriculumId?: string | Types.ObjectId;

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
