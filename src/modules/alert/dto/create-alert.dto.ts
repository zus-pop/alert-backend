import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { Enrollment } from '../../../shared/schemas';

class SupervisorResponse {
  @IsString()
  @IsNotEmpty()
  response: string;

  @IsString()
  @IsOptional()
  plan?: string;
}

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  enrollmentId: Types.ObjectId | Enrollment; // ObjectId of Enrollment

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  content: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    type: 'object',
    properties: {
      response: { type: 'string' },
      plan: { type: 'string' },
    },
    required: ['response'],
  })
  @ValidateNested()
  @Type(() => SupervisorResponse)
  supervisorResponse?: SupervisorResponse;

  @IsString()
  @IsOptional()
  @IsIn(['RESPONDED', 'NOT RESPONDED'])
  @ApiProperty({
    enum: ['RESPONDED', 'NOT RESPONDED'],
    default: 'NOT RESPONDED',
  })
  status?: 'RESPONDED' | 'NOT RESPONDED';

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  @ApiProperty({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
  })
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}
