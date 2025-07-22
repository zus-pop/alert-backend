import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { StudentModule } from '../student/student.module';
import { AnalysisAgent, ChatAgent } from './agents';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [StudentModule, CurriculumModule],
  controllers: [AiController],
  providers: [AiService, GeminiProvider, AnalysisAgent, ChatAgent],
  exports: [AiService],
})
export class AiModule {}
