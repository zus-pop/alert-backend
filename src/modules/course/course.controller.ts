import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { Pagination, SortCriteria } from '../../shared/dto';
import { CourseService } from './course.service';
import { CourseQueries } from './dto/course.queries.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  findAll(
    @Query() queries: CourseQueries,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.courseService.findAll(queries, sortCriteria, pagination);
  }

  @Get(':id/sessions')
  findSessionsByCourseId(@Param('id') id: string) {
    return this.courseService.findManySessionById(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
