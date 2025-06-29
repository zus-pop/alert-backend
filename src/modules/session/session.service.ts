import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model } from 'mongoose';
import { RedisService } from '../../shared/redis/redis.service';
import { Session } from '../../shared/schemas';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
    private readonly redisService: RedisService,
  ) {}

  async createManySessionByCourseId(courseId: string) {
    const date = new Date();
    const sessions = Array.from({ length: 20 }).map((_, index) => ({
      courseId,
      title: `Session No ${index + 1}`,
      startTime: date,
      endTime: date,
    }));
    return this.sessionModel.insertMany(sessions);
  }

  findAllByCourseId(courseId: string) {
    return this.sessionModel.find({ courseId: courseId }).populate('courseId');
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

  async removeManyByCourseId(courseId: string): Promise<DeleteResult> {
    return await this.sessionModel.deleteMany({ courseId });
  }
}
