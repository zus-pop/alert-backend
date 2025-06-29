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
import { AlertService } from './alert.service';
import { AlertQueries, CreateAlertDto, UpdateAlertDto } from './dto';

@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertService.create(createAlertDto);
  }

  @Get()
  findAll(
    @Query() queries: AlertQueries,
    @Query() sortCriteria: SortCriteria,
    @Query() pagination: Pagination,
  ) {
    return this.alertService.findAll(queries, sortCriteria, pagination);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertService.update(id, updateAlertDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertService.remove(id);
  }
}
