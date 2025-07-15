import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { MAJOR_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { CreateMajorDto, MajorQueries, UpdateMajorDto } from './dto';
import { Major } from '../../shared/schemas';

@Injectable()
export class MajorService {
  constructor(
    @InjectModel(Major.name) private readonly majorModel: Model<Major>,
    private readonly redisService: RedisService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(MAJOR_CACHE_KEY);
  }

  async create(createMajorDto: CreateMajorDto) {
    try {
      const existingMajor = await this.majorModel.findOne({
        majorCode: createMajorDto.majorCode,
      });

      if (existingMajor) {
        throw new BadRequestException('Major code already exists');
      }

      const major = await this.majorModel.create(createMajorDto);
      await this.clearCache();
      return major;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    queries: MajorQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    if (queries.majorName) {
      queries.majorName = {
        $regex: queries.majorName,
        $options: 'i',
      };
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [majors, total] = await Promise.all([
      this.majorModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.majorModel.countDocuments(queries),
    ]);

    const response = {
      data: majors,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');
    const major = await this.majorModel.findById(id);
    if (!major) throw new NotFoundException('Major not found');
    return major;
  }

  async findByCode(code: string) {
    if (!isValidObjectId(code))
      throw new BadRequestException('Id is wrong format');
    const major = await this.majorModel.findOne({ majorCode: code });
    if (!major) throw new NotFoundException('Major not found');
    return major;
  }

  async update(id: string, updateMajorDto: UpdateMajorDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const major = await this.majorModel.findByIdAndUpdate(id, updateMajorDto, {
      new: true,
    });

    if (!major) throw new BadRequestException('Major not found');

    await this.clearCache();
    return major;
  }

  async remove(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const result = await this.majorModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Major not found!');
    }

    await this.clearCache();
    return result;
  }
}
