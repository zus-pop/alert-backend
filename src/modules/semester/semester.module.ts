import { Module } from '@nestjs/common';
import { SemesterService } from './semester.service';
import { SemesterController } from './semester.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Semester, SemesterSchema } from '../../shared/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Semester.name,
        schema: SemesterSchema,
      },
    ]),
  ],
  controllers: [SemesterController],
  providers: [SemesterService],
})
export class SemesterModule {}
