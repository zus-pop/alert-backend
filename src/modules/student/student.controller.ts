import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Pagination } from '../../shared/dto/pagination.dto';
import { SortCriteria } from '../../shared/dto/sort.dto';
import { CreateStudentDto, UpdateStudentDto } from './dto';
import { StudentQueries } from './dto/student.queries.dto';
import { StudentService } from './student.service';

@ApiTags('Students')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  @Get()
  @ApiQuery({
    name: 'sortBy',
    enum: ['firstName', 'lastName', 'createdAt', 'updatedAt'],
    required: false,
  })
  async find(
    @Query() queries: StudentQueries,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.studentService.find(queries, sortCriteria, pagination);
  }

  @Get(':studentId/enrollments')
  @ApiQuery({
    name: 'status',
    enum: ['IN PROGRESS', 'NOT PASSED', 'PASSED'],
    required: false,
  })
  @ApiQuery({
    name: 'semesterId',
    type: String,
    required: false,
  })
  async findEnrollmentsByStudentId(
    @Param('studentId') studentId: string,
    @Query('status') status: string,
    @Query('semesterId') semesterId: string,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.studentService.findEnrollmentsByStudentId(
      studentId,
      status,
      semesterId ? new Types.ObjectId(semesterId) : undefined,
      sortCriteria,
      pagination,
    );
  }

  @Get(':studentId/enrollments/:enrollmentId')
  async findEnrollmentByStudentId(
    @Param('studentId') studentId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.studentService.findEnrollmentByEnrollmentIdAndStudentId(
      new Types.ObjectId(studentId),
      new Types.ObjectId(enrollmentId),
    );
  }

  @Get(':studentId/enrollments/:enrollmentId/attendances')
  async findAttendancesByEnrollmentIdAndStudentId(
    @Param('studentId') studentId: string,
    @Param('enrollmentId') enrollmentId: string,
  ) {
    return this.studentService.findAttendancesByEnrollmentIdAndStudentId(
      new Types.ObjectId(studentId),
      new Types.ObjectId(enrollmentId),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.studentService.restore(id);
  }
}
