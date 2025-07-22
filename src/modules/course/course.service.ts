import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { COURSE_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Course } from '../../shared/schemas';
import { SessionService } from '../session/session.service';
import { CourseQueries } from './dto/course.queries.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Course.name) private courseModel: Model<Course>,
    private readonly sessionService: SessionService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(COURSE_CACHE_KEY);
  }

  async create(createCourseDto: CreateCourseDto) {
    if (
      !isValidObjectId(createCourseDto.semesterId) ||
      !isValidObjectId(createCourseDto.subjectId)
    )
      throw new WrongIdFormatException(
        'SemesterId or SubjectId is wrong format',
      );

    try {
      const course = await this.courseModel.create({
        ...createCourseDto,
        semesterId: new Types.ObjectId(createCourseDto.semesterId),
        subjectId: new Types.ObjectId(createCourseDto.subjectId),
      });

      await this.sessionService.createManySessionByCourseId(course._id);
      await this.clearCache();
      return course;
    } catch (error) {
      throw new BadRequestException({ message: error.message });
    }
  }

  async findAll(
    queries: CourseQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? '_id';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    if (queries.title) {
      queries.title = {
        $regex: queries.title,
        $options: 'i',
      };
    }

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

    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const course = await this.courseModel
      .findById(id)
      .populate('semesterId')
      .populate('subjectId');

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findManySessionByCourseId(id: string) {
    return await this.sessionService.findAllByCourseId(id);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const course = await this.courseModel.findByIdAndUpdate(
        id,
        updateCourseDto,
        { new: true },
      );
      await this.clearCache();
      return course;
    } catch (error) {
      throw new BadRequestException({ message: error.message });
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const course = await this.courseModel.findByIdAndDelete(id);

      if (!course) {
        throw new BadRequestException('Course not found');
      }

      await this.sessionService.removeManyByCourseId(course._id);
      await this.clearCache();

      return { message: 'Course and related 20 sessions deleted successfully' };
    } catch (error) {
      throw new BadRequestException({ message: error.message });
    }
  }
}
