import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  startTime: Date;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty()
  endTime: Date;
}
