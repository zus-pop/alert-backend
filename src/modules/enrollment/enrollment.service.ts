import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model, Types } from 'mongoose';
import { ENROLLMENT_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Enrollment, GradeDocument } from '../../shared/schemas';
import { EnrollmentQueries } from './dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { SessionService } from '../session/session.service';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,

    private readonly attendanceService: AttendanceService,
    private readonly sessionService: SessionService,
  ) {}
  async create(createEnrollmentDto: CreateEnrollmentDto) {
    if (
      !isValidObjectId(createEnrollmentDto.studentId) ||
      !isValidObjectId(createEnrollmentDto.courseId)
    )
      throw new WrongIdFormatException('Invalid student or course ID');

    try {
      const enrollment = await this.enrollmentModel.create(createEnrollmentDto);
      const sessions = await this.sessionService.findAllByCourseId(
        enrollment.courseId.toString(),
      );
      await this.attendanceService.createByEnrollmentIdAndSessionId(
        enrollment._id,
        sessions.map((session) => session._id),
      );
      await this.clearCache();
      return enrollment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async clearCache() {
    await this.redisService.clearCache(ENROLLMENT_CACHE_KEY);
  }

  async findAll(
    queries: EnrollmentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    if (queries.studentId) {
      queries.studentId = new Types.ObjectId(queries.studentId);
    }
    const sortField = sortCriteria.sortBy ?? 'enrollmentDate';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.enrollmentModel.countDocuments(queries),
    ]);

    const response = {
      data: enrollments,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findByStudentId(
    studentId: Types.ObjectId,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'enrollmentDate';
    const sortOrder =
      sortCriteria.order === 'ascending' || sortCriteria.order === 'asc'
        ? 1
        : -1;

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find({
          studentId: studentId,
        })
        .populate({
          path: 'courseId',
          populate: [
            {
              path: 'subjectId',
              select: 'subjectCode subjectName',
            },
            {
              path: 'semesterId',
              select: 'semesterName startDate endDate',
            },
          ],
        })
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.enrollmentModel.countDocuments({ studentId: studentId }),
    ]);

    const response = {
      data: enrollments,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    return response;
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    const enrollment = await this.enrollmentModel
      .findById(id)
      .populate('studentId')
      .populate('courseId');

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    return enrollment;
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const enrollment = await this.enrollmentModel.findByIdAndUpdate(
        id,
        updateEnrollmentDto,
        {
          new: true,
        },
      );

      if (!enrollment) throw new NotFoundException('Enrollment not found');

      if (enrollment.grade.length > 0) {
        const types: GradeDocument['type'][] = [
          'progress test',
          'assignment',
          'practical exam',
          'final exam',
        ];
        const hasAllGrade = types.every((type) =>
          enrollment.grade.some(
            (grade) => grade.type === type && grade.score !== null,
          ),
        );

        if (hasAllGrade) {
          // Calculate final grade using weighted average
          const progressTest = enrollment.grade.find(
            (g) => g.type === 'progress test',
          );
          const assignment = enrollment.grade.find(
            (g) => g.type === 'assignment',
          );
          const practicalExam = enrollment.grade.find(
            (g) => g.type === 'practical exam',
          );
          const finalExam = enrollment.grade.find(
            (g) => g.type === 'final exam',
          );

          const finalGrade =
            progressTest!.score * progressTest!.weight +
            assignment!.score * assignment!.weight +
            practicalExam!.score * practicalExam!.weight +
            finalExam!.score * finalExam!.weight;

          enrollment.finalGrade = finalGrade;
          enrollment.status = finalGrade >= 5.0 ? 'PASSED' : 'NOT PASSED';

          await enrollment.save();
        }
      }

      await this.clearCache();
      return enrollment;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();
    try {
      const enrollment = await this.enrollmentModel.findByIdAndDelete(id);
      if (!enrollment) throw new NotFoundException('Enrollment not found');
      await this.attendanceService.deleteMany(enrollment._id);
      await this.clearCache();
      return enrollment;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
