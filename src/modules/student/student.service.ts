import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model, Types } from 'mongoose';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { Student, StudentDocument } from '../../shared/schemas';
import { EnrollmentQueries } from '../enrollment/dto';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { CreateStudentDto, StudentQueries, UpdateStudentDto } from './dto';
import { STUDENT_CACHE_KEY } from '../../shared/constant';
import { WrongIdFormatException } from '../../shared/exceptions';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    private readonly redisService: RedisService,
    private readonly enrollmentService: EnrollmentService,
    private readonly attendanceService: AttendanceService,
  ) {}

  async clearCache() {
    await this.redisService.clearCache(STUDENT_CACHE_KEY);
  }

  async getAllStudentIds() {
    const studentIds = await this.studentModel
      .where({ isDeleted: false })
      .find()
      .select('_id');

    return studentIds;
  }

  async find(
    queries: StudentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    const sortField = sortCriteria.sortBy ?? 'firstName';
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

    const [students, total] = await Promise.all([
      this.studentModel
        .where({ isDeleted: false })
        .select('-password -__v')
        .find(queries)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.studentModel.where({ isDeleted: false }).countDocuments(queries),
    ]);

    const response = {
      data: students,
      totalItems: total,
      totalPage: Math.ceil(total / limit),
    };
    return response;
  }

  async findById(id: string) {
    if (!isValidObjectId(id)) {
      this.logger.error('Finding student by ID:', id);
      throw new WrongIdFormatException();
    }

    const student = await this.studentModel
      .where({ isDeleted: false })
      .findById(id)
      .select('-password -__v');

    if (!student) throw new NotFoundException('Student not found!');

    return student;
  }

  async retrieveStudentDataById(id: string) {
    const student = await this.findById(id);

    // Get all enrollments for this student
    const enrollments = await this.enrollmentService.findAllByStudentId(
      student._id,
    );

    const enrollmentWithAttendances = await Promise.all(
      enrollments.data.map(async (enrollment) => {
        const attendances = await this.attendanceService.findByEnrollmentId(
          enrollment._id,
        );
        return {
          ...enrollment.toObject(),
          attendances: attendances,
          attendanceSummary: {
            total: attendances.length,
            attended: attendances.filter((a) => a.status === 'Attended').length,
            absent: attendances.filter((a) => a.status === 'Absent').length,
            notYet: attendances.filter((a) => a.status === 'Not Yet').length,
          },
        };
      }),
    );

    return {
      studentInfo: student,
      enrollments: enrollmentWithAttendances,
      totalEnrollments: enrollments.totalItems,
    };
  }

  private calculateProfileCompleteness(student: StudentDocument): number {
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'dateOfBirth',
    ];
    const completedFields = requiredFields.filter((field) => student[field]);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  async findEnrollmentsByStudentId(
    id: string,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    await this.findById(id);

    return await this.enrollmentService.findByStudentId(
      new Types.ObjectId(id),
      sortCriteria,
      pagination,
    );
  }

  async findEnrollmentByEnrollmentIdAndStudentId(
    studentId: Types.ObjectId,
    enrollmentId: Types.ObjectId,
  ) {
    await this.findById(studentId.toString());

    const enrollment = await this.enrollmentService.findOne(
      enrollmentId.toString(),
    );

    if (!enrollment?.studentId._id.equals(studentId))
      throw new BadRequestException(
        'This enrollment does not belong to this student',
      );

    return enrollment;
  }

  async findAttendancesByEnrollmentIdAndStudentId(
    studentId: Types.ObjectId,
    enrollmentId: Types.ObjectId,
  ) {
    await this.findById(studentId.toString());

    const enrollment = await this.enrollmentService.findOne(
      enrollmentId.toString(),
    );

    if (!enrollment?.studentId._id.equals(studentId))
      throw new BadRequestException(
        'This enrollment does not belong to this student',
      );

    const attendances = await this.attendanceService.findByEnrollmentId(
      enrollment._id,
    );
    return attendances;
  }

  async findByEmail(email: string) {
    const student = await this.studentModel
      .where({ isDeleted: false })
      .findOne({ email: email });

    if (!student) throw new NotFoundException('Student not found!');

    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    try {
      const student = await this.studentModel.findOne({
        email: createStudentDto.email,
      });

      if (student) throw new BadRequestException('Email existed');
      await this.clearCache();
      return await this.studentModel.create(createStudentDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    try {
      const student = await this.studentModel
        .where({ isDeleted: false })
        .findByIdAndUpdate(id, updateStudentDto, { new: true });
      if (!student) throw new BadRequestException('Student not found');
      await this.clearCache();
      return student;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async remove(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const result = await this.studentModel
        .where({ isDeleted: false })
        .findByIdAndUpdate(
          id,
          { isDeleted: true, deletedAt: new Date() },
          { new: true },
        );

      if (!result) {
        throw new NotFoundException('Student not found!');
      }
      await this.clearCache();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async restore(id: string) {
    if (!isValidObjectId(id)) throw new WrongIdFormatException();

    try {
      const result = await this.studentModel
        .where({ isDeleted: true })
        .findByIdAndUpdate(
          id,
          { isDeleted: false, deletedAt: null },
          { new: true },
        );

      if (!result) {
        throw new NotFoundException('Student not found!');
      }
      await this.clearCache();
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
