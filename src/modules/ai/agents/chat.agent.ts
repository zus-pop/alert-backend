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
import { CurriculumService } from '../../curriculum/curriculum.service';

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  studentId: Annotation<string>,
  studentInfo: Annotation<string>,
  curriculumInfo: Annotation<string>,
});

@Injectable()
export class ChatAgent {
  private readonly chat: ReturnType<typeof StateGraph.prototype.compile>;

  constructor(
    @Inject('GEMINI') private readonly llm: BaseChatModel,
    private readonly studentService: StudentService,
    private readonly curriculumService: CurriculumService,
  ) {
    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        'system',
        `Bạn là một trợ lý AI thân thiện, giọng điệu phong cách sinh viên ưu tiên GenZ về vấn đề học tập của sinh viên FPT,
            giải đáp thắc mắc của họ và cũng như đưa ra giải pháp giúp họ dựa vào thông tin điểm số của họ.
            Nếu họ hỏi về vấn đề nào đó không liên quan đến học tập thì hãy từ chối trả lời.
            Sinh viên cần đạt ít nhất 45 tín chỉ (credit) từ những kỳ trước để có thể tham gia OJT, bằng không là sẽ phải học cho đến khi đủ tín chỉ

            ==================================
            Đây là thông tin của chương trình học của một sinh viên:
            {curriculumInfo}
            ==================================
    
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
      const student = await this.studentService.findById(state.studentId);
      const studentData = await this.studentService.retrieveStudentDataById(
        state.studentId,
      );

      const curriculumData = await this.curriculumService.findOne(
        student.curriculumId.toString(),
        student._id.toString(),
      );
      return {
        ...state,
        studentInfo: JSON.stringify(studentData),
        curriculumInfo: JSON.stringify(curriculumData),
      };
    };

    const callModel = async (state: typeof StateAnnotation.State) => {
      const trimmedMessages = await trimmer.invoke(state.messages);
      const prompt = await promptTemplate.invoke({
        messages: trimmedMessages,
        studentInfo: state.studentInfo,
        studentId: state.studentId,
        curriculumInfo: state.curriculumInfo,
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
