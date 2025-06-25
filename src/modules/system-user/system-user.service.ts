import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { SystemUser, SystemUserDocument } from '../../shared/schemas';
import { CreateSystemUserDto, UpdateSystemUserDto } from './dto';
import { SystemUserQueries } from './dto/system-user.queries.dto';

@Injectable()
export class SystemUserService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
  ) {}

  create(createSystemUserDto: CreateSystemUserDto) {
    return this.systemUserModel.create(createSystemUserDto);
  }

  async findAll(
    queries: SystemUserQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    // Find cached data first
    const key = this.redisService.hashKey('system-users', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });
    const cacheData =
      await this.redisService.getCachedData<SystemUserDocument>(key);
    if (cacheData) return cacheData;

    const sortField = sortCriteria.sortBy ?? 'firstName';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;

    if (queries.firstName) {
      queries.firstName = {
        $regex: queries.firstName,
        $options: 'i',
      };
    }

    if (queries.lastName) {
      queries.lastName = {
        $regex: queries.lastName,
        $options: 'i',
      };
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [systemUsers, total] = await Promise.all([
      this.systemUserModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.systemUserModel.countDocuments(queries),
    ]);

    const response = {
      data: systemUsers,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    if (systemUsers.length)
      this.redisService.cacheData({
        key: key,
        data: response,
        ttl: 30,
      });

    return response;
  }

  async findById(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is not right format');

    const cachedData =
      await this.redisService.getCachedData<SystemUserDocument>(
        `system-user:${id}`,
      );

    if (cachedData) return cachedData;

    const systemUser = await this.systemUserModel
      .findById(id)
      .select('-password -__v');

    if (!systemUser) throw new NotFoundException('System user not found');

    this.redisService.cacheData({
      key: `system-user:${id}`,
      data: systemUser,
      ttl: 30,
    });

    return systemUser;
  }

  async findByEmail(email: string) {
    const student = await this.systemUserModel.findOne({ email: email });

    if (!student) throw new NotFoundException('System not found!');

    return student;
  }

  async update(id: string, updateSystemUserDto: UpdateSystemUserDto) {
    const systemUser = await this.findById(id);

    Object.keys(updateSystemUserDto).forEach(key => {
      if (updateSystemUserDto[key] !== undefined) {
        systemUser[key] = updateSystemUserDto[key];
      }
    });
    this.redisService.invalidate(`system-user:${id}`);
    return systemUser.save();
  }

  async remove(id: string) {
    const result = await this.systemUserModel.findByIdAndDelete(id);

    if (!result) throw new NotFoundException('System user not found');

    return result;
  }
}
