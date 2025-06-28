import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model, Types } from 'mongoose';
import { ENROLLMENT_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Enrollment } from '../../shared/schemas';
import { EnrollmentQueries } from './dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  create(createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentModel.create(createEnrollmentDto);
  }

  async clearCache() {
    await this.redisService.clearCache(ENROLLMENT_CACHE_KEY);
  }

  async findAll(
    queries: EnrollmentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    if (queries.studentId) {
      queries.studentId = new Types.ObjectId(queries.studentId);
    }
    const sortField = sortCriteria.sortBy ?? 'enrollmentDate';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

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
    return response;
  }

  async findByStudentId(
    studentId: Types.ObjectId,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'enrollmentDate';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find({
          studentId: studentId,
        })
        .populate({
          path: 'courseId',
          populate: [
            {
              path: 'subjectId',
              select: 'subjectCode subjectName',
            },
            {
              path: 'semesterId',
              select: 'semesterName startDate endDate',
            },
          ],
        })
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.enrollmentModel.countDocuments({ studentId: studentId }),
    ]);

    const response = {
      data: enrollments,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

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
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const enrollment = await this.enrollmentModel.findByIdAndUpdate(
        id,
        updateEnrollmentDto,
        {
          new: true,
        },
      );

      if (!enrollment) throw new NotFoundException('Enrollment not found');
      await this.clearCache();
      await session.commitTransaction();
      return enrollment;
    } catch (error) {
      await session.abortTransaction();
      throw new NotFoundException(error.message);
    } finally {
      await session.endSession();
    }
  }

  async remove(id: number) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const enrollment = await this.enrollmentModel.findByIdAndDelete(id);
      if (!enrollment) throw new NotFoundException('Enrollment not found');
      await this.clearCache();
      await session.commitTransaction();
      return enrollment;
    } catch (error) {
      await session.abortTransaction();
      throw new NotFoundException(error.message);
    } finally {
      await session.endSession();
    }
  }
}
