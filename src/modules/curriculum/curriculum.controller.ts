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
import { CurriculumService } from './curriculum.service';
import {
  CreateCurriculumDto,
  CurriculumQueries,
  UpdateCurriculumDto,
} from './dto';
import { Pagination, SortCriteria } from '../../shared/dto';
import { ApiProperty, ApiQuery } from '@nestjs/swagger';

@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Post()
  create(@Body() createCurriculumDto: CreateCurriculumDto) {
    return this.curriculumService.create(createCurriculumDto);
  }

  @Get()
  findAll(
    @Query() queries: CurriculumQueries,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.curriculumService.findAll(queries, sortCriteria, pagination);
  }

  @Get(':id')
  @ApiQuery({
    name: 'studentId',
    description: 'Append with student enrollment data',
    required: false,
    type: String,
  })
  findOne(@Param('id') id: string, @Query('studentId') studentId?: string) {
    return this.curriculumService.findOne(id, studentId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCurriculumDto: UpdateCurriculumDto,
  ) {
    return this.curriculumService.update(id, updateCurriculumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.curriculumService.remove(id);
  }
}
