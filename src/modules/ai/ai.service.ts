import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ChatAgent } from './agents';
import { AskDto } from './dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private readonly chatAgent: ChatAgent) {}

  async ask(askDto: AskDto, studentId: string) {
    try {
      return await this.chatAgent.ask(askDto, studentId);
    } catch (error) {
      this.logger.error('Error interacting with Chat Agent:', error.message);
      throw new InternalServerErrorException(
        `Sorry, an error occurred while processing your request. Please try again later.`,
      );
    }
  }
}
