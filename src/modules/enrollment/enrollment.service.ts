import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ENROLLMENT_CACHE_KEY, STUDENT_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Enrollment } from '../../shared/schemas';
import { AttendanceService } from '../attendance/attendance.service';
import { SessionService } from '../session/session.service';
import { EnrollmentQueries } from './dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentService {
  constructor(
    private readonly redisService: RedisService,
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    @Inject(forwardRef(() => AttendanceService))
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
      const enrollment = await this.enrollmentModel.create({
        ...createEnrollmentDto,
        studentId: new Types.ObjectId(createEnrollmentDto.studentId),
        courseId: new Types.ObjectId(createEnrollmentDto.courseId),
      });
      const sessions = await this.sessionService.findAllByCourseId(
        enrollment.courseId.toString(),
      );
      await this.attendanceService.createByEnrollmentIdAndSessionId(
        enrollment._id,
        sessions.map((session) => session._id),
      );

      if (enrollment.grade.length > 0) {
        const hasAllGrades = enrollment.grade.every(
          (grade) => grade.score !== null,
        );

        const totalWeight = enrollment.grade.reduce(
          (sum, grade) => sum + grade.weight,
          0,
        );

        if (hasAllGrades && Math.abs(totalWeight - 1) < Number.EPSILON) {
          const finalGrade = enrollment.grade.reduce(
            (sum, grade) => sum + grade.score! * grade.weight,
            0,
          );

          enrollment.finalGrade = finalGrade;
          enrollment.status = finalGrade >= 5.0 ? 'PASSED' : 'NOT PASSED';
        } else {
          enrollment.status = 'IN PROGRESS';
          enrollment.finalGrade = undefined;
        }
        await enrollment.save();
      }

      await this.clearCache();
      return enrollment;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async clearCache() {
    await this.redisService.clearCache(ENROLLMENT_CACHE_KEY);
    await this.redisService.clearCache(STUDENT_CACHE_KEY);
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

    // If semesterId is provided, use aggregation pipeline for nested filtering
    if (queries.semesterId) {
      const semesterObjectId = new Types.ObjectId(queries.semesterId);
      // Build match conditions excluding semesterId
      const matchConditions = { ...queries };
      delete matchConditions.semesterId;

      const [result] = await this.enrollmentModel.aggregate([
        // Stage 1: Match enrollment-level conditions
        { $match: matchConditions },

        // Stage 2: Lookup course details
        {
          $lookup: {
            from: 'course',
            localField: 'courseId',
            foreignField: '_id',
            as: 'courseId',
          },
        },
        { $unwind: '$courseId' },

        // Stage 3: Filter by semesterId in the course
        {
          $match: {
            'courseId.semesterId': semesterObjectId,
          },
        },

        // Stage 4: Lookup student details
        {
          $lookup: {
            from: 'student',
            localField: 'studentId',
            foreignField: '_id',
            as: 'studentId',
          },
        },
        { $unwind: '$studentId' },

        // Stage 5: Project necessary fields
        {
          $project: {
            _id: 1,
            courseId: 1,
            studentId: {
              firstName: '$studentId.firstName',
              lastName: '$studentId.lastName',
              email: '$studentId.email',
              image: '$studentId.image',
            },
            enrollmentDate: 1,
            grade: 1,
            status: 1,
            finalGrade: 1,
          },
        },

        // Stage 6: Use $facet for data and count
        {
          $facet: {
            data: [
              { $sort: { [sortField]: sortOrder } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]);
      const enrollments = result.data;
      const total = result.totalCount[0]?.count || 0;

      return {
        data: enrollments,
        totalItems: total,
        totalPage: Math.ceil(total / limit),
      };
    }

    // Original logic for non-semester filtering
    const [enrollments, total] = await Promise.all([
      this.enrollmentModel
        .find(queries)
        .populate('studentId', 'firstName lastName email image')
        .populate('courseId')
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
    status: string,
    semesterId: Types.ObjectId | undefined,
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

    const rootMatch: {
      studentId: Types.ObjectId;
      status?: string;
      semesterId?: Types.ObjectId;
    } = { studentId: studentId };

    if (status) {
      rootMatch.status = status;
    }

    const result = await this.enrollmentModel.aggregate([
      { $match: rootMatch },

      {
        $lookup: {
          from: 'course',
          localField: 'courseId',
          foreignField: '_id',
          as: 'courseId',
        },
      },
      { $unwind: '$courseId' },

      ...(semesterId
        ? [
            {
              $match: {
                'courseId.semesterId': semesterId,
              },
            },
          ]
        : []),

      {
        $lookup: {
          from: 'subject',
          localField: 'courseId.subjectId',
          foreignField: '_id',
          as: 'courseId.subjectId',
        },
      },
      { $unwind: '$courseId.subjectId' },

      {
        $lookup: {
          from: 'semester',
          localField: 'courseId.semesterId',
          foreignField: '_id',
          as: 'courseId.semesterId',
        },
      },
      { $unwind: '$courseId.semesterId' },

      {
        $lookup: {
          from: 'student',
          localField: 'studentId',
          foreignField: '_id',
          as: 'studentId',
        },
      },
      {
        $unwind: '$studentId',
      },

      {
        $project: {
          _id: 1,
          courseId: 1,
          studentId: {
            firstName: '$studentId.firstName',
            lastName: '$studentId.lastName',
            email: '$studentId.email',
            image: '$studentId.image',
          },
          enrollmentDate: 1,
          grade: 1,
          status: 1,
          finalGrade: 1,
        },
      },

      {
        $sort: { [sortField]: sortOrder },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },

      {
        $facet: {
          data: [{ $sort: { [sortField]: sortOrder } }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const enrollments = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    const response = {
      data: enrollments,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };

    const group = await this.groupByEnrollmentStatus(studentId);

    return {
      ...response,
      groupByEnrollmentStatus: group,
    };
  }

  async groupByEnrollmentStatus(studentId: Types.ObjectId) {
    const result = await this.enrollmentModel.aggregate([
      {
        $match: { studentId: studentId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // Ensure all status types are included with default count of 0
    const statusTypes = ['IN PROGRESS', 'NOT PASSED', 'PASSED'];
    const completeResult = statusTypes.map((status) => {
      const found = result.find((item) => item.status === status);
      return {
        status,
        count: found ? found.count : 0,
      };
    });

    return completeResult;
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

  async findAllByStudentId(studentId: Types.ObjectId) {
    if (!isValidObjectId(studentId)) throw new WrongIdFormatException();

    const enrollments = await this.enrollmentModel
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
      });

    return {
      data: enrollments,
      totalItems: enrollments.length,
    };
  }

  async updateNotPassedIfOverAbsenteeismRate(enrollmentId: Types.ObjectId) {
    const { isOverAbsenteeismRate } =
      await this.attendanceService.checkAbsenteeismRate(enrollmentId);

    const status = isOverAbsenteeismRate ? 'NOT PASSED' : 'IN PROGRESS';
    await this.enrollmentModel.findByIdAndUpdate(
      enrollmentId,
      {
        status: status,
      },
      {
        new: true,
      },
    );
    await this.clearCache();
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

      const { isOverAbsenteeismRate } =
        await this.attendanceService.checkAbsenteeismRate(enrollment._id);

      if (enrollment.grade.length > 0) {
        const hasAllGrades = enrollment.grade.every(
          (grade) => grade.score !== null,
        );

        const totalWeight = enrollment.grade.reduce(
          (sum, grade) => sum + grade.weight,
          0,
        );

        if (hasAllGrades && Math.abs(totalWeight - 1) < Number.EPSILON) {
          const finalGrade = enrollment.grade.reduce(
            (sum, grade) => sum + grade.score! * grade.weight,
            0,
          );

          enrollment.finalGrade = finalGrade;
          enrollment.status =
            finalGrade >= 5.0 && !isOverAbsenteeismRate
              ? 'PASSED'
              : 'NOT PASSED';
        } else {
          if (isOverAbsenteeismRate) enrollment.status = 'NOT PASSED';
          else enrollment.status = 'IN PROGRESS';
          enrollment.finalGrade = undefined;
        }
        await enrollment.save();
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
