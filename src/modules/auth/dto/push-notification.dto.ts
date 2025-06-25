import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class PushTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  token: string;
}

class NotificationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  body: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  imageUrl?: string;
}
export class MessageDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ApiProperty()
  tokens: string[];

  @IsNotEmptyObject()
  @ApiProperty()
  notification: NotificationDto;
}
