import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PushToken {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  token: string;
}
