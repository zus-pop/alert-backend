import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { COMBO_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { ComboQueries, CreateComboDto, UpdateComboDto } from './dto';
import { Combo } from '../../shared/schemas';

@Injectable()
export class ComboService {
  constructor(
    @InjectModel(Combo.name) private readonly comboModel: Model<Combo>,
    private readonly redisService: RedisService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(COMBO_CACHE_KEY);
  }

  async create(createComboDto: CreateComboDto) {
    try {
      const existingCombo = await this.comboModel.findOne({
        comboCode: createComboDto.comboCode,
      });

      if (existingCombo) {
        throw new BadRequestException('Combo code already exists');
      }

      const combo = await this.comboModel.create({
        ...createComboDto,
        majorId: new Types.ObjectId(createComboDto.majorId),
      });
      await this.clearCache();
      return combo;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    queries: ComboQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    if (queries.comboCode) {
      queries.comboCode = {
        $regex: queries.comboCode,
        $options: 'i',
      };
    }

    if (queries.comboName) {
      queries.comboName = {
        $regex: queries.comboName,
        $options: 'i',
      };
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [combos, total] = await Promise.all([
      this.comboModel
        .find(queries)
        .populate({
          path: 'majorId',
          select: 'majorCode majorName -_id',
        })
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.comboModel.countDocuments(queries),
    ]);

    const response = {
      data: combos,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');
    const combo = await this.comboModel.findById(id);
    if (!combo) throw new NotFoundException('Combo not found');
    return combo;
  }

  async update(id: string, updateComboDto: UpdateComboDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const combo = await this.comboModel.findByIdAndUpdate(
      id,
      {
        ...updateComboDto,
        majorId: new Types.ObjectId(updateComboDto.majorId),
      },
      {
        new: true,
      },
    );

    if (!combo) throw new BadRequestException('Combo not found');

    await this.clearCache();
    return combo;
  }

  async remove(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const result = await this.comboModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Combo not found!');
    }

    await this.clearCache();
    return result;
  }
}
