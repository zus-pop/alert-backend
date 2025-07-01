import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AskDto } from '../dto';

const ResponseFormatter = z.object({
  enrollmentId: z.string().describe('ID của khoá học sinh viên đăng ký (_id)'),
  title: z
    .string()
    .describe('Tiêu đề của bản ghi thông báo với nội dung của AI'),
  content: z.string().describe('Nội dung phân tích của AI'),
  riskLevel: z
    .enum(['LOW', 'MEDIUM', 'HIGH'])
    .describe(
      'Mức độ rủi ro dựa trên phân tích của AI về sinh viên đối với khoá học đó',
    ),
  shouldGetAlert: z
    .boolean()
    .describe(
      'Cho biết AI có khuyến nghị gửi cảnh báo cho sinh viên hay không',
    ),
});

const StateAnnotation = Annotation.Root({
  message: Annotation<BaseMessage>,
  enrollmentInfo: Annotation<string>,
  result: Annotation<typeof ResponseFormatter>,
});

@Injectable()
export class AnalysisAgent {
  private readonly chat: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(@Inject('GEMINI') private readonly llm: BaseChatModel) {
    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Bạn là một nhà phân tích dữ liệu học tập của sinh viên FPT, chuyên cung cấp thông tin và phân tích dựa trên điểm số và thông tin học tập của họ.
        Đây là thông tin đối với khoá mà học sinh viên đang theo học:
        {enrollmentInfo}`,
      ],
      new MessagesPlaceholder('message'),
    ]);

    const callModel = async (state: typeof StateAnnotation.State) => {
      const prompt = await promptTemplate.invoke({
        message: state.message,
        enrollmentInfo: state.enrollmentInfo,
      });
      const llmWithStructure = this.llm.withStructuredOutput(ResponseFormatter);
      const response = await llmWithStructure.invoke(prompt);
      return { result: response };
    };

    const workflow = new StateGraph(StateAnnotation)
      .addNode('model', callModel)
      .addEdge(START, 'model')
      .addEdge('model', END);

    this.chat = workflow.compile();
  }

  async analyze(askDto: AskDto, enrollmentInfo: string) {
    const response = await this.chat.invoke({
      message: new HumanMessage(askDto.question),
      enrollmentInfo: enrollmentInfo,
    });

    return response.result as typeof ResponseFormatter._type;
  }
}
