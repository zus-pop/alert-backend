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
import { CreateSystemUserDto, UpdateSystemUserDto } from './dto';
import { SystemUserQueries } from './dto/system-user.queries.dto';
import { SystemUserService } from './system-user.service';

@Controller('system-users')
export class SystemUserController {
  constructor(private readonly systemUserService: SystemUserService) {}

  @Post()
  create(@Body() createSystemUserDto: CreateSystemUserDto) {
    return this.systemUserService.create(createSystemUserDto);
  }

  @Get()
  findAll(
    @Query() queries: SystemUserQueries,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.systemUserService.findAll(queries, sortCriteria, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemUserService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSystemUserDto: UpdateSystemUserDto,
  ) {
    return this.systemUserService.update(id, updateSystemUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.systemUserService.remove(id);
  }
}
