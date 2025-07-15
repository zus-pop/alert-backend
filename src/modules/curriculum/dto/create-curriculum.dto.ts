import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

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

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ApiProperty({
    description: 'List of subject IDs included in the curriculum',
    required: true,
    type: [String],
  })
  subjectIds: string[];
}
