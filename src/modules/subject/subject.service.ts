import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject } from './subject.schema';
import { SubjectQueries } from './dto/subject.params.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  async find(queries: SubjectQueries) {
    return this.subjectModel.find(queries);
  }
}
