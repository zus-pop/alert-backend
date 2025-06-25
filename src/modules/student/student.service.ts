import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { Student, StudentDocument } from '../../shared/schemas';
import { EnrollmentQueries } from '../enrollment/dto';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { CreateStudentDto, StudentQueries, UpdateStudentDto } from './dto';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    private readonly redisService: RedisService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async find(
    queries: StudentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    // Find cached data first
    const key = this.redisService.hashKey('students', {
      ...queries,
      ...sortCriteria,
      ...pagination,
    });
    const cacheData =
      await this.redisService.getCachedData<StudentDocument>(key);
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

    const [students, total] = await Promise.all([
      this.studentModel
        .find(queries)
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

    if (students.length)
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

    const student = await this.studentModel
      .findById(id)
      .select('-password -__v');

    if (!student) throw new NotFoundException('Student not found!');

    return student;
  }

  async retrieveStudentDataById(id: string) {
    const student = await this.findById(id);

    // Get all enrollments for this student
    const result = await this.enrollmentService.findByStudentId(
      new Types.ObjectId(id),
      {},
      { sortBy: 'updatedAt', order: 'desc' },
      { page: 1, limit: 100 },
    );

    return {
      studentInfo: student,
      enrollments: result.data,
      totalEnrollments: result.totalItems,
      profileCompleteness: this.calculateProfileCompleteness(student),
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
    queries: EnrollmentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
    await this.findById(id);

    return await this.enrollmentService.findByStudentId(
      new Types.ObjectId(id),
      queries,
      sortCriteria,
      pagination,
    );
  }

  async findEnrollmentByEnrollmentIdAndStudentId(
    studentId: Types.ObjectId,
    enrollmentId: Types.ObjectId,
  ) {
    const enrollment = await this.enrollmentService.findOne(
      enrollmentId.toString(),
    );

    if (!enrollment?.studentId._id.equals(studentId))
      throw new BadRequestException(
        'This enrollment does not belong to this student',
      );

    return enrollment;
  }

  async findByEmail(email: string) {
    const student = await this.studentModel.findOne({ email: email });

    if (!student) throw new NotFoundException('Student not found!');

    return student;
  }

  async create(createStudentDto: CreateStudentDto) {
    return this.studentModel.create(createStudentDto);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    const student = await this.findById(id);

    Object.keys(updateStudentDto).forEach(key => {
      if (updateStudentDto[key] !== undefined) {
        student[key] = updateStudentDto[key];
      }
    });
    return student.save();
  }

  async remove(id: string) {
    const result = await this.studentModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Student not found!');
    }

    return result;
  }
}
