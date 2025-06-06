import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pagination, SortCriteria } from '../../shared/dto';
import { StudentQueries } from './dto';
import { Student } from './student.schema';
import { CreateStudentDto } from './dto/student.create.dto';
import { UpdateStudentDto } from './dto/student.update.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    @Inject(CACHE_MANAGER) private redisCache: Cache,
  ) {}

  async find(
    queries: StudentQueries,
    sortCriteria: SortCriteria,
    pagination: Pagination,
  ) {
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

    return {
      data: students,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException('Id is not right format');

    const student = await this.studentModel.findById(id);

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
