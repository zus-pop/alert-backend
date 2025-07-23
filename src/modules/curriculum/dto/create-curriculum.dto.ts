import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { Types } from 'mongoose';

class Subjects {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the subject',
    type: String,
  })
  subjectId: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'The semester number for the subject',
    type: Number,
  })
  semesterNumber: number;
}

export class CreateCurriculumDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the curriculum',
    required: true,
  })
  curriculumName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The code of the curriculum',
    required: true,
    type: String,
  })
  comboId: string | Types.ObjectId;

  @IsObject({ each: true })
  @IsArray()
  @IsNotEmpty({ each: true })
  @ApiProperty({
    description: 'List of subject IDs included in the curriculum',
    required: true,
    type: [Subjects],
  })
  subjects: Subjects[];
}
