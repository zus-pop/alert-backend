import { Injectable, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Student } from './student.schema';
import { Model } from 'mongoose';
import { StudentParams } from './dto/student.params.dto';
import { SortCriteria } from '../../shared/dto/sort.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
  ) {}

  async find(queries: StudentParams, sortCriteria: SortCriteria) {
    const sortField = sortCriteria.sortBy ?? 'firstName';
    const sortOrder = sortCriteria.order === 'desc' ? -1 : 1;
    return this.studentModel.find(queries).sort({ [sortField]: sortOrder });
  }
}
