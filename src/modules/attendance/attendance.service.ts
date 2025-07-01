import { BadRequestException, Injectable, Logger, Type } from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RedisService } from '../../shared/redis/redis.service';
import { Attendance } from '../../shared/schemas';
import { DeleteResult, isValidObjectId, Model, Types } from 'mongoose';
import { ATTENDANCE_CACHE_KEY } from '../../shared/constant';
import { AttendanceQueries } from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';

@Injectable()
export class AttendanceService {
  private readonly logger: Logger = new Logger(AttendanceService.name);
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(ATTENDANCE_CACHE_KEY);
  }

  create(createAttendanceDto: CreateAttendanceDto) {
    return 'This action adds a new attendance';
  }

  async createByEnrollmentIdAndSessionId(
    enrollmentId: Types.ObjectId,
    sessionIds: Types.ObjectId[],
  ) {
    if (!isValidObjectId(enrollmentId)) throw new WrongIdFormatException();

    const attendances = sessionIds.map((sessionId) => {
      if (!isValidObjectId(sessionId)) {
        throw new WrongIdFormatException(`Invalid session ID: ${sessionId}`);
      }
      return {
        enrollmentId,
        sessionId,
        status: 'NOT YET',
      };
    });
    const result = await this.attendanceModel.insertMany(attendances);
    this.logger.log(
      `Created ${result.length} attendances for enrollment ID: ${enrollmentId}`,
    );
    return result;
  }

  async deleteMany(enrollmentId: Types.ObjectId): Promise<DeleteResult> {
    if (!isValidObjectId(enrollmentId)) throw new WrongIdFormatException();

    const result = await this.attendanceModel.deleteMany({ enrollmentId });
    this.logger.log(
      `Deleted ${result.deletedCount} attendances for enrollment ID: ${enrollmentId}`,
    );

    return result;
  }

  async findAll(
    queries: AttendanceQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [attendances, total] = await Promise.all([
      this.attendanceModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.attendanceModel.countDocuments(queries),
    ]);

    const response = {
      data: attendances,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findByEnrollmentId(enrollmentId: Types.ObjectId) {
    if (!isValidObjectId(enrollmentId)) throw new WrongIdFormatException();

    const attendances = await this.attendanceModel.find({ enrollmentId });

    return attendances;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const attendance = await this.attendanceModel.findById(id);

    if (!attendance) {
      throw new BadRequestException(`Attendance with id ${id} not found`);
    }

    return attendance;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const attendance = await this.attendanceModel.findByIdAndUpdate(
      id,
      updateAttendanceDto,
      { new: true },
    );

    if (!attendance) {
      throw new BadRequestException(`Attendance with id ${id} not found`);
    }

    return attendance;
  }

  remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const attendance = this.attendanceModel.findByIdAndDelete(id);

    if (!attendance) {
      throw new BadRequestException(`Attendance with id ${id} not found`);
    }

    return attendance;
  }
}
