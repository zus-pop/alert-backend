import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { SYSTEM_USER_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { SystemUser } from '../../shared/schemas';
import {
  CreateSystemUserDto,
  SystemUserQueries,
  UpdateSystemUserDto,
} from './dto';

@Injectable()
export class SystemUserService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(SystemUser.name) private systemUserModel: Model<SystemUser>,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(SYSTEM_USER_KEY);
  }

  async create(createSystemUserDto: CreateSystemUserDto) {
    // Check if the email already exists
    const existingUser = await this.systemUserModel.findOne({
      email: createSystemUserDto.email,
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    try {
      const systemUser = await this.systemUserModel.create(createSystemUserDto);
      await this.clearCache();
      return systemUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    queries: SystemUserQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

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

    return response;
  }

  async findById(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const systemUser = await this.systemUserModel.findById(id).select('-__v');

    if (!systemUser) throw new NotFoundException('System user not found');
    return systemUser;
  }

  async findByEmail(email: string) {
    const student = await this.systemUserModel.findOne({ email: email });

    if (!student) throw new NotFoundException('System not found!');

    return student;
  }

  async update(id: string, updateSystemUserDto: UpdateSystemUserDto) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const systemUser = await this.systemUserModel.findByIdAndUpdate(
        id,
        updateSystemUserDto,
        { new: true },
      );

      if (!systemUser) throw new BadRequestException('System User not found');

      await this.clearCache();
      return systemUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const result = await this.systemUserModel.findByIdAndDelete(id);
      if (!result) throw new NotFoundException('System user not found');
      await this.clearCache();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
