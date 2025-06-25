import { Injectable } from '@nestjs/common';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Semester, SemesterDocument } from '../../shared/schemas';
import { Model } from 'mongoose';
import { SemesterQueries } from './dto/semester.queries.dto';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class SemesterService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Semester.name) private semesterModel: Model<Semester>,
  ) {}

  create(createSemesterDto: CreateSemesterDto) {
    return 'This action adds a new semester';
  }

  async findAll(
    queries: SemesterQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    // Find cached data first
    const key = this.redisService.hashKey('semesters', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });
    const cacheData =
      await this.redisService.getCachedData<SemesterDocument>(key);
    if (cacheData) return cacheData;

    const sortField = sortCriteria.sortBy ?? 'semesterName';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;

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

    if (semesters.length)
      this.redisService.cacheData({
        key: key,
        data: response,
        ttl: 30,
      });

    return response;
  }

  findOne(id: string) {
    return `This action returns a #${id} semester`;
  }

  update(id: string, updateSemesterDto: UpdateSemesterDto) {
    return `This action updates a #${id} semester`;
  }

  remove(id: string) {
    return `This action removes a #${id} semester`;
  }
}
