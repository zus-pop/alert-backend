import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Alert } from '../../shared/schemas';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { RedisService } from '../../shared/redis/redis.service';
import { ALERT_CACHE_KEY } from '../../shared/constant';
import { WrongIdFormatException } from '../../shared/exceptions';
import { AlertQueries } from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';
import path from 'path';

@Injectable()
export class AlertService {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<Alert>,
    private readonly redisService: RedisService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(ALERT_CACHE_KEY);
  }

  async create(createAlertDto: CreateAlertDto) {
    if (!isValidObjectId(createAlertDto.enrollmentId))
      throw new WrongIdFormatException('Invalid Enrollment ID format');

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const alert = await this.alertModel.create(createAlertDto);
      session.commitTransaction();
      this.clearCache();
      return alert;
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
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

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      this.alertModel
        .find(queries)
        .populate({
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
        })
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.alertModel.countDocuments(queries),
    ]);

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

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const alert = await this.alertModel.findByIdAndUpdate(
        id,
        updateAlertDto,
        { new: true },
      );
      if (!alert) throw new NotFoundException(`Alert with id ${id} not found`);

      await this.clearCache();
      await session.commitTransaction();
      return alert;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const result = await this.alertModel.findByIdAndDelete(id);
      if (!result) throw new NotFoundException(`Alert with id ${id} not found`);

      this.clearCache();
      session.commitTransaction();
      return result;
    } catch (error) {
      session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
