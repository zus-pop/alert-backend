import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const GeminiProvider: Provider = {
  provide: 'GEMINI',
  useFactory: (configService: ConfigService) => {
    const API_KEY = configService.get<string>('GEMINI_API_KEY');
    if (!API_KEY) {
      throw new Error(
        'GEMINI_API_KEY is not defined in your .env file. Ensure @nestjs/config is set up.',
      );
    }

    return new ChatGoogleGenerativeAI({
        apiKey: API_KEY,
        model: 'gemini-2.0-flash'
    })
  },
  inject: [ConfigService],
};
