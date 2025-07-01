import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  BaseMessage,
  HumanMessage,
  trimMessages,
} from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import {
  Annotation,
  END,
  MemorySaver,
  messagesStateReducer,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { Inject, Injectable } from '@nestjs/common';
import { StudentService } from '../../student/student.service';
import { AskDto } from '../dto';

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  studentId: Annotation<string>,
  studentInfo: Annotation<string>,
});

@Injectable()
export class ChatAgent {
  private readonly chat: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(
    @Inject('GEMINI') private readonly llm: BaseChatModel,
    private readonly studentService: StudentService,
  ) {
    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Bạn là một trợ lý AI thân thiện, giọng điệu phong cách sinh viên ưu tiên GenZ về vấn đề học tập của sinh viên FPT,
            giải đáp thắc mắc của họ và cũng như đưa ra giải pháp giúp họ dựa vào thông tin điểm số của họ.
            Nếu họ hỏi về vấn đề nào đó không liên quan đến học tập thì hãy từ chối trả lời
    
            ==================================
            Đây là thông tin của một học sinh:
            {studentInfo}
            ==================================
    
            Hãy xưng hô dựa trên firstName của họ
            `,
      ],
      new MessagesPlaceholder('messages'),
    ]);

    const trimmer = trimMessages({
      maxTokens: 12,
      strategy: 'last',
      tokenCounter: (msgs) => msgs.length,
      includeSystem: true,
      allowPartial: false,
      startOn: 'human',
    });

    const retrieveStudentData = async (state: typeof StateAnnotation.State) => {
      const studentData = await this.studentService.retrieveStudentDataById(
        state.studentId,
      );
      console.log(
        'Retrieved student data:',
        JSON.stringify(studentData, null, 2),
      );
      return {
        ...state,
        studentInfo: JSON.stringify(studentData),
      };
    };

    const callModel = async (state: typeof StateAnnotation.State) => {
      const trimmedMessages = await trimmer.invoke(state.messages);
      const prompt = await promptTemplate.invoke({
        messages: trimmedMessages,
        studentInfo: state.studentInfo,
        studentId: state.studentId,
      });
      const response = await this.llm.invoke(prompt);
      return { messages: [response] };
    };

    const workflow = new StateGraph(StateAnnotation)
      .addNode('rag', retrieveStudentData)
      .addNode('model', callModel)
      .addEdge(START, 'rag')
      .addEdge('rag', 'model')
      .addEdge('model', END);

    const memory = new MemorySaver();
    this.chat = workflow.compile({ checkpointer: memory });
  }

  async ask(askDto: AskDto, studentId: string) {
    const config = { configurable: { thread_id: studentId } };
    const response = await this.chat.invoke(
      {
        messages: [new HumanMessage(askDto.question)],
        studentId,
      },
      config,
    );
    return response.messages[response.messages.length - 1].content as string;
  }
}
