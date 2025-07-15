import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AlertQueries {
  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Filter by student ID',
    type: String,
  })
  studentId?: string; // ObjectId of Student

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Filter by alert title',
    type: String,
  })
  title?: string | {};

  @IsString()
  @IsOptional()
  @IsIn(['RESPONDED', 'NOT RESPONDED'])
  @ApiProperty({
    enum: ['RESPONDED', 'NOT RESPONDED'],
    required: false,
    description: 'Filter by response status',
    type: String,
  })
  status?: 'RESPONDED' | 'NOT RESPONDED';

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  @ApiProperty({
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
    description: 'Filter by risk level',
    type: String,
  })
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Filter by enrollment ID',
    type: String,
  })
  enrollmentId?: string; // ObjectId of Enrollment
}
