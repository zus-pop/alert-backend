import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from '../../shared/schemas';
import { CreateSubjectDto, SubjectQueries, UpdateSubjectDto } from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class SubjectService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  create(createSubjectDto: CreateSubjectDto) {
    return this.subjectModel.create(createSubjectDto);
  }

  async findAll(
    queries: SubjectQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    // Find cached data first
    const key = this.redisService.hashKey('subjects', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });
    const cacheData =
      await this.redisService.getCachedData<SubjectDocument>(key);
    if (cacheData) return cacheData;

    const sortField = sortCriteria.sortBy ?? 'subjectName';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;

    if (queries.subjectName) {
      queries.subjectName = {
        $regex: queries.subjectName,
        $options: 'i',
      };
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      this.subjectModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.subjectModel.countDocuments(queries),
    ]);

    const response = {
      data: subjects,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    if (subjects.length)
      this.redisService.cacheData({
        key: key,
        data: response,
        ttl: 30,
      });

    return response;
  }

  async findOne(id: string) {
    const cachedData = await this.redisService.getCachedData<SubjectDocument>(
      `subject:${id}`,
    );

    if (cachedData) return cachedData;

    const subject = await this.subjectModel.findById(id);

    if (!subject) throw new NotFoundException('Subject not found');

    this.redisService.cacheData({
      key: `subject:${id}`,
      data: subject,
      ttl: 30,
    });

    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const subject = await this.findOne(id);

    Object.assign(subject, updateSubjectDto);

    this.redisService.invalidate(`student:${id}`);
    return subject.save();
}

async remove(id: string) {
    const result = await this.subjectModel.findByIdAndDelete(id);
    
    if (!result) {
        throw new NotFoundException('Subject not found!');
    }
    
    this.redisService.invalidate(`student:${id}`);
    return result;
  }
}
