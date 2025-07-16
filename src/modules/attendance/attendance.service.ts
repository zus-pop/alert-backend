import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, isValidObjectId, Model, Types } from 'mongoose';
import { ATTENDANCE_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Attendance, Enrollment } from '../../shared/schemas';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { AttendanceQueries } from './dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger: Logger = new Logger(AttendanceService.name);
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @Inject(forwardRef(() => EnrollmentService))
    private readonly enrollmentService: EnrollmentService,
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

    await this.clearCache();

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

    if (queries.enrollmentId)
      queries.enrollmentId = new Types.ObjectId(queries.enrollmentId);
    if (queries.sessionId)
      queries.sessionId = new Types.ObjectId(queries.sessionId);

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

    const attendances = await this.attendanceModel
      .find({ enrollmentId })
      .populate('sessionId', 'startTime endTime');

    return attendances;
  }

  async checkAbsenteeismRate(enrollmentId: Types.ObjectId): Promise<boolean> {
    const attendances = await this.findByEnrollmentId(enrollmentId);

    if (attendances.length === 0) {
      return false;
    }

    const absentCount = attendances.filter(
      (attendance) => attendance.status === 'ABSENT',
    ).length;
    const absenteeismRate = absentCount / attendances.length;

    return absenteeismRate >= 0.2;
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

    const attendance = await this.attendanceModel
      .findByIdAndUpdate(id, updateAttendanceDto, { new: true })

    if (!attendance) {
      throw new BadRequestException(`Attendance with id ${id} not found`);
    }

    await this.enrollmentService.updateNotPassedIfOverAbsenteeismRate(
      new Types.ObjectId(attendance.enrollmentId.toString()),
    );

    await this.clearCache();

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
