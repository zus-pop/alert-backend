import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { SEMESTER_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Semester } from '../../shared/schemas';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { SemesterQueries } from './dto/semester.queries.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemesterService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Semester.name) private semesterModel: Model<Semester>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(SEMESTER_CACHE_KEY);
  }

  async create(createSemesterDto: CreateSemesterDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const semester = await this.semesterModel.create(createSemesterDto);
      await this.clearCache();
      await session.commitTransaction();
      return semester;
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await session.endSession();
    }
  }

  async findAll(
    queries: SemesterQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    if (queries.semesterName) {
      queries.semesterName = {
        $regex: queries.semesterName,
        $options: 'i',
      };
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [semesters, total] = await Promise.all([
      this.semesterModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.semesterModel.countDocuments(queries),
    ]);

    const response = {
      data: semesters,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();
    const semester = await this.semesterModel.findById(id);
    if (!semester) throw new NotFoundException('Semester not found');
    return semester;
  }

  async update(id: string, updateSemesterDto: UpdateSemesterDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const semester = await this.semesterModel.findByIdAndUpdate(
        id,
        updateSemesterDto,
        { new: true },
      );

      if (!semester) throw new BadRequestException('Semester not found');

      await this.clearCache();
      await session.commitTransaction();
      return semester;
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const semester = await this.semesterModel.findByIdAndDelete(id);
      await this.clearCache();
      await session.commitTransaction();
      return semester;
    } catch (error) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await session.endSession();
    }
  }
}
