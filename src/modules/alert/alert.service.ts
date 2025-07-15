import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  ALERT_CACHE_KEY,
  ALERT_RESPONDED_EVENT,
  NEW_ALERT_EVENT,
} from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Alert } from '../../shared/schemas';
import { AlertQueries, CreateAlertDto, UpdateAlertDto } from './dto';
import { NewAlertEvent, RespondedAlertEvent } from './events';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<Alert>,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(ALERT_CACHE_KEY);
  }

  async create(createAlertDto: CreateAlertDto) {
    if (!isValidObjectId(createAlertDto.enrollmentId))
      throw new WrongIdFormatException('Invalid Enrollment ID format');

    try {
      const alert = await (
        await this.alertModel.create({
          ...createAlertDto,
          enrollmentId: new Types.ObjectId(createAlertDto.enrollmentId),
        })
      ).populate('enrollmentId');
      this.eventEmitter.emit(
        NEW_ALERT_EVENT,
        new NewAlertEvent(
          alert.enrollmentId.studentId as Types.ObjectId,
          alert.title,
          alert.content,
        ),
      );
      await this.clearCache();
      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    queries: AlertQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    if (queries.title) {
      queries.title = {
        $regex: queries.title,
        $options: 'i',
      };
    }

    let studentId: Types.ObjectId | undefined;
    if (queries.studentId) {
      studentId = new Types.ObjectId(queries.studentId);
      delete queries.studentId;
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    // First get all alerts matching the base queries
    const allAlerts = await this.alertModel
      .find(queries)
      .populate({
        path: 'enrollmentId',
        populate: [
          {
            path: 'studentId',
            select: 'firstName lastName',
          },
          {
            path: 'courseId',
            select: 'semesterId subjectId',
            populate: [
              {
                path: 'subjectId',
                select: 'subjectName subjectCode',
              },
              {
                path: 'semesterId',
                select: 'semesterName startDate endDate',
              },
            ],
          },
        ],
      })
      .sort({ [sortField]: sortOrder });

    // Filter by studentId in JavaScript if provided
    const filteredAlerts = studentId
      ? allAlerts.filter(
          (alert) =>
            alert.enrollmentId?.studentId?._id?.toString() ===
            studentId.toString(),
        )
      : allAlerts;

    // Apply pagination in JavaScript
    const total = filteredAlerts.length;
    const alerts = filteredAlerts.slice(skip, skip + limit);

    const response = {
      data: alerts,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const alert = await this.alertModel.findById(id).populate({
      path: 'enrollmentId',
      populate: [
        {
          path: 'studentId',
          select: 'firstName lastName email image',
        },
        {
          path: 'courseId',
          select: 'semesterId subjectId',
          populate: [
            {
              path: 'subjectId',
              select: 'subjectName subjectCode',
            },
            {
              path: 'semesterId',
              select: 'semesterName startDate endDate',
            },
          ],
        },
      ],
    });
    if (!alert) throw new NotFoundException(`Alert with id ${id} not found`);
    return alert;
  }

  async update(id: string, updateAlertDto: UpdateAlertDto) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const alert = await this.alertModel
        .findByIdAndUpdate(
          id,
          {
            ...updateAlertDto,
            status: 'RESPONDED',
          },
          { new: true },
        )
        .populate('enrollmentId');
      if (!alert) throw new NotFoundException(`Alert with id ${id} not found`);

      this.eventEmitter.emit(
        ALERT_RESPONDED_EVENT,
        new RespondedAlertEvent(
          alert.enrollmentId.studentId as Types.ObjectId,
          alert.title,
          alert.content,
          alert.supervisorResponse,
        ),
      );
      await this.clearCache();
      return alert;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const result = await this.alertModel.findByIdAndDelete(id);
      if (!result) throw new NotFoundException(`Alert with id ${id} not found`);

      this.clearCache();

      return result;
    } catch (error) {
      throw error;
    } finally {
    }
  }
}
