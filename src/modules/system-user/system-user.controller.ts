import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SystemUserService } from './system-user.service';
import { CreateSystemUserDto, UpdateSystemUserDto } from './dto';
import { SystemUserQueries } from './dto/system-user.queries.dto';
import { Pagination, SortCriteria } from '../../shared/dto';

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
