import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { Course, EnrollmentDocument } from '../../shared/schemas';
import { CourseQueries } from './dto/course.queries.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { SessionService } from '../session/session.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    @InjectConnection() private readonly connection: Connection,
    private readonly sessionService: SessionService,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const course = await this.courseModel.create(createCourseDto);

      await this.sessionService.createManySessionByCourseId(
        course._id.toString(),
      );

      await session.commitTransaction();
      return course;
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException({ message: error.message });
    } finally {
      await session.endSession();
    }
  }

  async findAll(
    queries: CourseQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    // Find cached data first
    const key = this.redisService.hashKey('courses', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });
    const cacheData =
      await this.redisService.getCachedData<EnrollmentDocument>(key);
    if (cacheData) return cacheData;

    const sortField = sortCriteria.sortBy ?? '_id';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.courseModel
        .find(queries)
        .populate('subjectId')
        .populate('semesterId')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.courseModel.countDocuments(queries),
    ]);

    const response = {
      data: courses,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    if (courses.length)
      this.redisService.cacheData({
        key: key,
        data: response,
        ttl: 30,
      });

    return response;
  }

  async findOne(id: string) {
    const course = await this.courseModel
      .findById(id)
      .populate('semesterId')
      .populate('subjectId');

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findManySessionById(id: string) {
    return await this.sessionService.findAllByCourseId(id);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.findOne(id);

    Object.assign(course, updateCourseDto);
    return course.save();
  }

  async remove(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const course = await this.courseModel.findByIdAndDelete(id, { session });

      if (!course) {
        throw new BadRequestException('Course not found');
      }

      await this.sessionService.removeManyByCourseId(id);

      await session.commitTransaction();
      return { message: 'Course and related 20 sessions deleted successfully' };
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException({ message: error.message });
    } finally {
      await session.endSession();
    }
  }
}
