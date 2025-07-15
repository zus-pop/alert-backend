import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Curriculum,
  CurriculumCourse,
  CurriculumCourseSchema,
  CurriculumSchema,
} from '../../shared/schemas';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Curriculum.name,
        schema: CurriculumSchema,
      },
      {
        name: CurriculumCourse.name,
        schema: CurriculumCourseSchema,
      },
    ]),
  ],
  controllers: [CurriculumController],
  providers: [CurriculumService],
})
export class CurriculumModule {}
