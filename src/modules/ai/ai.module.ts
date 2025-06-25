import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiProvider } from './providers/gemini.provider';
import { StudentModule } from '../student/student.module';
import { ChatAgent } from './agents';

@Module({
  imports: [StudentModule],
  controllers: [AiController],
  providers: [AiService, GeminiProvider, ChatAgent],
})
export class AiModule {}
