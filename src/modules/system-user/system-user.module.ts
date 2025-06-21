import { Module } from '@nestjs/common';
import { SystemUserService } from './system-user.service';
import { SystemUserController } from './system-user.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemUser, SystemUserSchema } from '../../shared/schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SystemUser.name,
        schema: SystemUserSchema,
      },
    ]),
  ],
  controllers: [SystemUserController],
  providers: [SystemUserService],
  exports: [SystemUserService],
})
export class SystemUserModule {}
