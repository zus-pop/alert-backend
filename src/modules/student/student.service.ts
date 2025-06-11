import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pagination, SortCriteria } from '../../shared/dto';
import { RedisService } from '../../shared/redis/redis.service';
import { StudentQueries } from './dto';
import { CreateStudentDto } from './dto/student.create.dto';
import { UpdateStudentDto } from './dto/student.update.dto';
import { Student, StudentDocument } from './student.schema';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    private readonly redisService: RedisService,
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

    const student = await this.studentModel.findById(id);

    if (!student) throw new NotFoundException('Student not found!');

    return student;
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

    Object.assign(student, updateStudentDto);
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
