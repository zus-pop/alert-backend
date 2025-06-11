import { Controller, Get, Query } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectQueries } from './dto/subject.params.dto';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async find(@Query() queries: SubjectQueries) {
    return this.subjectService.find(queries);
  }
}
