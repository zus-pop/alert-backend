import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { RedisService } from '../../shared/redis/redis.service';
import { Enrollment, EnrollmentDocument } from '../../shared/schemas';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EnrollmentQueries } from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
  ) {}
  create(createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentModel.create(createEnrollmentDto);
  }

  async findAll(
    queries: EnrollmentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const key = this.redisService.hashKey('enrollments', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });

    const cacheData =
      await this.redisService.getCachedData<EnrollmentDocument>(key);
    if (cacheData) return cacheData;

    const sortField = sortCriteria.sortBy ?? 'enrollmentDate';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.enrollmentModel.countDocuments(queries),
    ]);

    const response = {
      data: enrollments,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    if (enrollments.length)
      this.redisService.cacheData({
        key: key,
        data: response,
        ttl: 30,
      });

    return response;
  }

  async findByStudentId(
    studentId: Types.ObjectId,
    queries: EnrollmentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const key = this.redisService.hashKey('enrollments', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });

    const cacheData =
      await this.redisService.getCachedData<EnrollmentDocument>(key);
    if (cacheData) return cacheData;

    const sortField = sortCriteria.sortBy ?? 'enrollmentDate';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find({
          studentId: new Types.ObjectId(studentId),
          ...queries,
        })
        .populate('studentId')
        .populate('courseId')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.enrollmentModel.countDocuments({ studentId: studentId, ...queries }),
    ]);

    const response = {
      data: enrollments,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    if (enrollments.length)
      this.redisService.cacheData({
        key: key,
        data: response,
        ttl: 30,
      });

    return response;
  }

  async findOne(id: string) {
    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('studentId')
      .populate('courseId');

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return enrollment;
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    const enrollment = await this.findOne(id);

    Object.assign(enrollment, updateEnrollmentDto);
    return enrollment.save();
  }

  remove(id: number) {
    return `This action removes a #${id} enrollment`;
  }
}
