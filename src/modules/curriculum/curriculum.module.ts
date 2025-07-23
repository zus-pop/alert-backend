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
import { EnrollmentModule } from '../enrollment/enrollment.module';

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
    EnrollmentModule,
  ],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
