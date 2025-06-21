import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { StudentModule } from '../student/student.module';
import { SystemUserModule } from '../system-user/system-user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
    AccessTokenStrategy,
    GoogleStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
} from './strategy';

@Module({
  imports: [JwtModule.register({}), StudentModule, SystemUserModule],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
    LocalStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
