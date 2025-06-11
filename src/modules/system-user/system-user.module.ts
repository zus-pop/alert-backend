import { Module } from '@nestjs/common';
import { SystemUserService } from './system-user.service';
import { SystemUserController } from './system-user.controller';

@Module({
  providers: [SystemUserService],
  controllers: [SystemUserController]
})
export class SystemUserModule {}
