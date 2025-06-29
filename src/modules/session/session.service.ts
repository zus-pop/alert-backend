import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Session } from '../../shared/schemas';
import { Model } from 'mongoose';
import { RedisService } from '../../shared/redis/redis.service';

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

  removeManyByCourseId(courseId: string) {
    return this.sessionModel.deleteMany({ courseId: courseId });
  }
}
