import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { WhoAmI } from '../auth/decorators';
import { PayloadDto } from '../auth/dto';
import { AccessTokenAuthGuard } from '../auth/guards';
import { AiService } from './ai.service';
import { AskDto } from './dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenAuthGuard)
  async ask(@Body() askDto: AskDto, @WhoAmI() me: PayloadDto) {
    const answer = await this.aiService.ask(askDto, me.sub);
    return {
      question: askDto.question,
      answer: answer,
    };
  }
}
