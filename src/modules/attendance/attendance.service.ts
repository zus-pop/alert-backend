import { Injectable } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RedisService } from '../../shared/redis/redis.service';
import { Attendance } from '../../shared/schemas';
import { Model } from 'mongoose';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
  ) {}

  create(createAttendanceDto: CreateAttendanceDto) {
    return 'This action adds a new attendance';
  }

  findAll() {
    return this.attendanceModel
      .find({})
      .populate('enrollmentId')
      .populate('sessionId');
  }

  findOne(id: string) {
    return `This action returns a #${id} attendance`;
  }

  update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    return `This action updates a #${id} attendance`;
  }

  remove(id: string) {
    return `This action removes a #${id} attendance`;
  }
}
