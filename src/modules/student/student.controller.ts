import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentQueries } from './dto/student.params.dto';
import { SortCriteria } from '../../shared/dto/sort.dto';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { Pagination } from '../../shared/dto/pagination.dto';
import { CreateStudentDto, UpdateStudentDto } from './dto';

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
    @Query() queries: StudentQueries,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.studentService.find(queries, sortCriteria, pagination);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStudentDto: CreateStudentDto) {}

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, updateStudentDto);
  }

  @Delete('id')
  async remove(@Param('id') id: string) {
    return this.remove(id);
  }
}
