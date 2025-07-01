import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { SUBJECT_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { Subject } from '../../shared/schemas';
import { CreateSubjectDto, SubjectQueries, UpdateSubjectDto } from './dto';

@Injectable()
export class SubjectService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(SUBJECT_CACHE_KEY);
  }

  async create(createSubjectDto: CreateSubjectDto) {
    try {
      const existingSubject = await this.subjectModel.findOne({
        subjectCode: createSubjectDto.subjectCode,
      });

      if (existingSubject) {
        throw new BadRequestException('Subject code already exists');
      }

      const subject = await this.subjectModel.create(createSubjectDto);
      await this.clearCache();
      return subject;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    queries: SubjectQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'subjectName';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

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
    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');
    const subject = await this.subjectModel.findById(id);
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const subject = await this.subjectModel.findByIdAndUpdate(
      id,
      updateSubjectDto,
      { new: true },
    );

    if (!subject) throw new BadRequestException('Subject not found');

    await this.clearCache();
    return subject;
  }

  async remove(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const result = await this.subjectModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Subject not found!');
    }

    await this.clearCache();
    return result;
  }
}
