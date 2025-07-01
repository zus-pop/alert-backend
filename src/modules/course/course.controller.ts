import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Pagination, SortCriteria } from '../../shared/dto';
import { CourseService } from './course.service';
import { CourseQueries } from './dto/course.queries.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Types } from 'mongoose';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Controller('courses')
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateCourseDto,
  })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (image) {
      const imageUrl = await this.firebaseService.uploadToCloud(
        'course',
        image,
      );
      createCourseDto.image = imageUrl;
    }
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
    return this.courseService.findManySessionByCourseId(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UpdateCourseDto,
  })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    if (image) {
      const imageUrl = await this.firebaseService.uploadToCloud(
        'course',
        image,
      );
      updateCourseDto.image = imageUrl;
    }
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
