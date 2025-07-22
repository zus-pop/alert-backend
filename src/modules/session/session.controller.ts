import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SessionService } from './session.service';
import { Types } from 'mongoose';
import { CreateSessionDto, UpdateSessionDto } from './dto';

@Injectable()
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  findAll() {
    return this.sessionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sessionService.findAllByCourseId(id);
  }

  @Post()
  create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionService.create(createSessionDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
    return this.sessionService.update(id, updateSessionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sessionService.remove(id);
  }
}
