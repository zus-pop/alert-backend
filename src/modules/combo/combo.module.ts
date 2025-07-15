import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Combo, ComboSchema } from '../../shared/schemas';
import { ComboController } from './combo.controller';
import { ComboService } from './combo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Combo.name,
        schema: ComboSchema,
      },
    ]),
  ],
  controllers: [ComboController],
  providers: [ComboService],
})
export class ComboModule {}
