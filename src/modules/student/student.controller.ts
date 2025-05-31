import { Controller, Get, Query } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentParams } from './dto/student.params.dto';
import { SortCriteria } from '../../shared/dto/sort.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  @ApiQuery({
    name: 'sortBy',
    enum: ['firstName', 'lastName', 'createdAt', 'updatedAt'],
    required: false,
  })
  async find(
    @Query() queries: StudentParams,
    @Query() sortCriteria: SortCriteria,
  ) {
    return this.studentService.find(queries, sortCriteria);
  }
}
