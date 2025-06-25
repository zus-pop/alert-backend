import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StudentDocument } from '../../shared/schemas';
import { WhoAmI } from '../auth/decorators';
import { AccessTokenAuthGuard } from '../auth/guards';
import { AiService } from './ai.service';
import { AskDto } from './dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PayloadDto } from '../auth/dto';

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
