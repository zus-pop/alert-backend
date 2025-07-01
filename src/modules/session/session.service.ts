import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, isValidObjectId, Model, Types } from 'mongoose';
import { RedisService } from '../../shared/redis/redis.service';
import { Session } from '../../shared/schemas';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { WrongIdFormatException } from '../../shared/exceptions';

@Injectable()
export class SessionService {
  private readonly logger: Logger = new Logger(SessionService.name);
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly redisService: RedisService,
  ) {}

  create(createSessionDto: CreateSessionDto) {
    return 'Not implemented yet';
  }

  async createManySessionByCourseId(courseId: Types.ObjectId) {
    const date = new Date();
    const sessions = Array.from({ length: 20 }).map((_, index) => ({
      courseId,
      title: `Session No ${index + 1}`,
      startTime: date,
      endTime: date,
    }));
    const result = await this.sessionModel.insertMany(sessions);
    this.logger.log(`Created ${result.length} sessions for course ${courseId}`);
    return result;
  }

  findAll() {
    return this.sessionModel.find().populate('courseId');
  }

  findAllByCourseId(courseId: string) {
    if (!isValidObjectId(courseId)) throw new WrongIdFormatException();
    return this.sessionModel
      .find({ courseId: new Types.ObjectId(courseId) })
      .populate('courseId');
  }

  async findOne(id: string) {
    const session = await this.sessionModel.findById(id);

    if (!session) throw new NotFoundException('Session not found');

    return session;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto) {
    const session = await this.sessionModel.findByIdAndUpdate(
      id,
      updateSessionDto,
      { new: true },
    );
    if (!session) throw new NotFoundException('Session not found');

    return session;
  }

  remove(id: string) {
    return `This action removes a #${id} session`;
  }

  async removeManyByCourseId(
    courseId: Types.ObjectId | string,
  ): Promise<DeleteResult> {
    if (courseId instanceof String) {
      courseId = new Types.ObjectId(courseId);
    }
    const result = await this.sessionModel.deleteMany({ courseId });
    this.logger.log(
      `Deleted ${result.deletedCount} sessions for course ${courseId}`,
    );
    return result;
  }
}
