import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { STUDENT_CACHE_KEY } from '../../shared/constant';
import { Pagination, SortCriteria } from '../../shared/dto';
import { WrongIdFormatException } from '../../shared/exceptions';
import { RedisService } from '../../shared/redis/redis.service';
import { Student, StudentDocument } from '../../shared/schemas';
import { AttendanceService } from '../attendance/attendance.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { CreateStudentDto, StudentQueries, UpdateStudentDto } from './dto';

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
      .find({ isDeleted: false })
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

    if (queries.email) {
      queries.email = {
        $regex: queries.email,
        $options: 'i',
      };
    }

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
        .find(queries)
        .select('-password -__v')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      this.studentModel.countDocuments(queries),
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
            attended: attendances.filter((a) => a.status === 'ATTENDED').length,
            absent: attendances.filter((a) => a.status === 'ABSENT').length,
            notYet: attendances.filter((a) => a.status === 'NOT YET').length,
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
    status: string,
    semesterId: Types.ObjectId | undefined,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    await this.findById(id);

    return await this.enrollmentService.findByStudentId(
      new Types.ObjectId(id),
      status,
      semesterId,
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
    const student = await this.studentModel.findOne({ email: email });

    if (!student) throw new NotFoundException('Student not found!');

    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    try {
      const isExist = await this.studentModel.findOne({
        email: createStudentDto.email,
      });

      if (isExist) throw new BadRequestException('Email existed');

      const student = await this.studentModel.create({
        ...createStudentDto,
        majorId: new Types.ObjectId(createStudentDto.majorId),
        comboId: new Types.ObjectId(createStudentDto.comboId),
        curriculumId: new Types.ObjectId(createStudentDto.curriculumId),
      });
      await this.clearCache();
      return student;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    try {
      if (!isValidObjectId(id)) throw new WrongIdFormatException();

      if (
        updateStudentDto.majorId &&
        !isValidObjectId(updateStudentDto.majorId)
      )
        throw new BadRequestException('Major ID is not valid');

      if (
        updateStudentDto.comboId &&
        !isValidObjectId(updateStudentDto.comboId)
      )
        throw new BadRequestException('Combo ID is not valid');

      if (
        updateStudentDto.curriculumId &&
        !isValidObjectId(updateStudentDto.curriculumId)
      )
        throw new BadRequestException('Curriculum ID is not valid');

      if (updateStudentDto.majorId) {
        updateStudentDto.majorId = new Types.ObjectId(updateStudentDto.majorId);
      }
      if (updateStudentDto.comboId) {
        updateStudentDto.comboId = new Types.ObjectId(updateStudentDto.comboId);
      }
      if (updateStudentDto.curriculumId) {
        updateStudentDto.curriculumId = new Types.ObjectId(
          updateStudentDto.curriculumId,
        );
      }

      const student = await this.studentModel.findByIdAndUpdate(
        id,
        updateStudentDto,
        { new: true },
      );
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
      const result = await this.studentModel.findByIdAndUpdate(
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
