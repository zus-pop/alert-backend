import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from '../../shared/schemas';
import { SessionModule } from '../session/session.module';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Course.name,
        schema: CourseSchema,
      },
    ]),
    SessionModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
