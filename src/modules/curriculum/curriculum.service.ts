import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CURRICULUM_CACHE_KEY } from '../../shared/constant';
import { RedisService } from '../../shared/redis/redis.service';
import {
  Curriculum,
  CurriculumCourse,
  EnrollmentDocument,
} from '../../shared/schemas';
import {
  CreateCurriculumDto,
  CurriculumQueries,
  UpdateCurriculumDto,
} from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';
import { EnrollmentService } from '../enrollment/enrollment.service';

@Injectable()
export class CurriculumService {
  constructor(
    @InjectModel(Curriculum.name)
    private readonly curriculumModel: Model<Curriculum>,
    @InjectModel(CurriculumCourse.name)
    private readonly curriculumCourseModel: Model<CurriculumCourse>,
    private readonly redisService: RedisService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(CURRICULUM_CACHE_KEY);
  }

  async create(createCurriculumDto: CreateCurriculumDto) {
    if (!isValidObjectId(createCurriculumDto.comboId))
      throw new BadRequestException('Combo ID is not valid');

    if (
      createCurriculumDto.subjects.length &&
      !createCurriculumDto.subjects.some((s) => isValidObjectId(s.subjectId))
    )
      throw new BadRequestException('One or more subject IDs are not valid');

    try {
      const curriculum = await this.curriculumModel.create({
        comboId: new Types.ObjectId(createCurriculumDto.comboId),
        curriculumName: createCurriculumDto.curriculumName,
      });

      const subjects = createCurriculumDto.subjects.map((s) => ({
        curriculumId: curriculum._id,
        subjectId: new Types.ObjectId(s.subjectId),
        semesterNumber: s.semesterNumber,
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

    if (queries.comboId) {
      queries.comboId = new Types.ObjectId(queries.comboId);
    }

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
          .map((subject) => ({
            ...subject.subjectId,
            semesterNumber: subject.semesterNumber,
          })),
      })),
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findOne(id: string, studentId?: string) {
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

    let studentEnrollments: EnrollmentDocument[] = [];
    if (studentId) {
      const enrollments = await this.enrollmentService.findAllByStudentId(
        new Types.ObjectId(studentId),
      );
      studentEnrollments = enrollments.data;
    }

    return {
      ...curriculum.toObject(),
      subjects: subjects.map((subject) => {
        const studentData = studentEnrollments.find(
          (enrollment) =>
            enrollment.courseId.subjectId._id.toString() ===
            subject.subjectId._id.toString(),
        );

        const data: any = {
          status: 'NOT YET',
        };

        if (studentData) {
          data.enrollmentId = studentData._id;
          data.status = studentData.status;
        }

        if (studentData?.finalGrade) {
          data.finalGrade = studentData.finalGrade;
        }
        return {
          ...subject.subjectId,
          semesterNumber: subject.semesterNumber,
          studentData: data,
        };
      }),
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
      updateCurriculumDto.subjects &&
      updateCurriculumDto.subjects.length &&
      !updateCurriculumDto.subjects.some((s) => isValidObjectId(s.subjectId))
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

    if (updateCurriculumDto.subjects) {
      const existingSubjects = await this.curriculumCourseModel
        .find({
          curriculumId: curriculum._id,
        })
        .select('subjectId semesterNumber');

      const existingSubjectIds = existingSubjects.map((subject) => ({
        subjectId: subject.subjectId.toString(),
        semesterNumber: subject.semesterNumber,
      }));

      const newSubjectIds = updateCurriculumDto.subjects;

      const toAdd = newSubjectIds.filter(
        (ns) =>
          !existingSubjectIds.some(
            (es) =>
              es.subjectId === ns.subjectId &&
              es.semesterNumber === ns.semesterNumber,
          ),
      );
      const toRemove = existingSubjectIds.filter(
        (es) =>
          !newSubjectIds.some(
            (ns) =>
              ns.subjectId === es.subjectId &&
              ns.semesterNumber === es.semesterNumber,
          ),
      );

      if (toRemove.length) {
        await this.curriculumCourseModel.deleteMany({
          curriculumId: curriculum._id,
          subjectId: {
            $in: toRemove.map((s) => new Types.ObjectId(s.subjectId)),
          },
        });
      }

      if (toAdd.length) {
        const subjectsToAdd = toAdd.map((s) => ({
          curriculumId: curriculum._id,
          subjectId: new Types.ObjectId(s.subjectId),
          semesterNumber: s.semesterNumber,
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
