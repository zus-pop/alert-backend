import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CURRICULUM_CACHE_KEY } from '../../shared/constant';
import { RedisService } from '../../shared/redis/redis.service';
import { Curriculum, CurriculumCourse } from '../../shared/schemas';
import {
  CreateCurriculumDto,
  CurriculumQueries,
  UpdateCurriculumDto,
} from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';

@Injectable()
export class CurriculumService {
  constructor(
    @InjectModel(Curriculum.name)
    private readonly curriculumModel: Model<Curriculum>,
    @InjectModel(CurriculumCourse.name)
    private readonly curriculumCourseModel: Model<CurriculumCourse>,
    private readonly redisService: RedisService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(CURRICULUM_CACHE_KEY);
  }

  async create(createCurriculumDto: CreateCurriculumDto) {
    if (!isValidObjectId(createCurriculumDto.comboId))
      throw new BadRequestException('Combo ID is not valid');

    if (
      createCurriculumDto.subjectIds.length &&
      !createCurriculumDto.subjectIds.some(isValidObjectId)
    )
      throw new BadRequestException('One or more subject IDs are not valid');

    try {
      const curriculum = await this.curriculumModel.create({
        comboId: new Types.ObjectId(createCurriculumDto.comboId),
        curriculumName: createCurriculumDto.curriculumName,
      });

      const subjects = createCurriculumDto.subjectIds.map((subjectId) => ({
        curriculumId: curriculum._id,
        subjectId: new Types.ObjectId(subjectId),
      }));

      await this.curriculumCourseModel.insertMany(subjects);
      await this.clearCache();
      return curriculum;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll(
    queries: CurriculumQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'updatedAt';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    if (queries.curriculumName) {
      queries.curriculumName = {
        $regex: queries.curriculumName as string,
        $options: 'i',
      };
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [curriculums, total] = await Promise.all([
      this.curriculumModel
        .find(queries)
        .populate('comboId')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.curriculumModel.countDocuments(queries),
    ]);

    const subjects = await this.curriculumCourseModel
      .find({ curriculumId: { $in: curriculums.map((c) => c._id) } })
      .populate({
        path: 'subjectId',
        transform: (doc) => ({
          _id: doc._id,
          subjectCode: doc.subjectCode,
          subjectName: doc.subjectName,
        }),
      });

    const response = {
      data: curriculums.map((curriculum) => ({
        ...curriculum.toObject(),
        subjects: subjects
          .filter(
            (subject) =>
              subject.curriculumId.toString() === curriculum._id.toString(),
          )
          .map((subject) => subject.subjectId),
      })),
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');
    const curriculum = await this.curriculumModel.findById(id);
    if (!curriculum) throw new NotFoundException('Curriculum not found');

    const subjects = await this.curriculumCourseModel
      .find({ curriculumId: curriculum._id })
      .populate({
        path: 'subjectId',
        transform: (doc) => ({
          _id: doc._id,
          subjectCode: doc.subjectCode,
          subjectName: doc.subjectName,
        }),
      });
    return {
      ...curriculum.toObject(),
      subjects: subjects.map((subject) => subject.subjectId),
    };
  }

  async update(id: string, updateCurriculumDto: UpdateCurriculumDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    if (
      updateCurriculumDto.comboId &&
      !isValidObjectId(updateCurriculumDto.comboId)
    )
      throw new BadRequestException('Combo ID is not valid');

    if (
      updateCurriculumDto.subjectIds &&
      updateCurriculumDto.subjectIds.length &&
      !updateCurriculumDto.subjectIds.some(isValidObjectId)
    )
      throw new BadRequestException('One or more subject IDs are not valid');

    const updateDto = {};

    if (updateCurriculumDto.comboId) {
      updateDto['comboId'] = new Types.ObjectId(updateCurriculumDto.comboId);
    }
    if (updateCurriculumDto.curriculumName) {
      updateDto['curriculumName'] = updateCurriculumDto.curriculumName;
    }

    const curriculum = await this.curriculumModel.findByIdAndUpdate(
      id,
      updateDto,
      {
        new: true,
      },
    );

    if (!curriculum) throw new BadRequestException('Curriculum not found');

    if (updateCurriculumDto.subjectIds) {
      const existingSubjects = await this.curriculumCourseModel
        .find({
          curriculumId: curriculum._id,
        })
        .select('subjectId');

      const existingSubjectIds = existingSubjects.map((subject) =>
        subject.subjectId.toString(),
      );

      const newSubjectIds = updateCurriculumDto.subjectIds;

      const toAdd = newSubjectIds.filter(
        (subjectId) => !existingSubjectIds.includes(subjectId),
      );
      const toRemove = existingSubjectIds.filter(
        (subjectId) => !newSubjectIds.includes(subjectId),
      );

      if (toRemove.length) {
        await this.curriculumCourseModel.deleteMany({
          curriculumId: curriculum._id,
          subjectId: { $in: toRemove.map((id) => new Types.ObjectId(id)) },
        });
      }

      if (toAdd.length) {
        const subjectsToAdd = toAdd.map((subjectId) => ({
          curriculumId: curriculum._id,
          subjectId: new Types.ObjectId(subjectId),
        }));
        await this.curriculumCourseModel.insertMany(subjectsToAdd);
      }
    }

    await this.clearCache();
    return curriculum;
  }

  async remove(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is wrong format');

    const result = await this.curriculumModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Curriculum not found!');
    }

    await this.curriculumCourseModel.deleteMany({ curriculumId: result._id });

    await this.clearCache();
    return result;
  }
}
