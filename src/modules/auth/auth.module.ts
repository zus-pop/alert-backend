import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from '../../shared/schemas/student.schema';
import {
    SystemUser,
    SystemUserSchema,
} from '../../shared/schemas/system-user.schema';
import { StudentModule } from '../student/student.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
    AccessTokenStrategy,
    GoogleStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
} from './strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Student.name,
        schema: StudentSchema,
      },
      {
        name: SystemUser.name,
        schema: SystemUserSchema,
      },
    ]),
    JwtModule.register({}),
    StudentModule,
  ],
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
