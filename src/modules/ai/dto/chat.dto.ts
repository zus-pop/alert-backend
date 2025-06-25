import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
export class AskDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
  })
  question: string;
}
