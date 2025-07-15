import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Major, MajorSchema } from '../../shared/schemas';
import { MajorController } from './major.controller';
import { MajorService } from './major.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Major.name,
        schema: MajorSchema,
      },
    ]),
  ],
  controllers: [MajorController],
  providers: [MajorService],
  exports: [MajorService],
})
export class MajorModule {}
