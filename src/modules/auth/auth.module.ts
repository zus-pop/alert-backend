import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from '../student/student.schema';
import { StudentService } from '../student/student.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy, JwtStrategy, LocalStrategy } from './strategy';
import {
  SystemUser,
  SystemUserSchema,
} from '../system-user/system-user.schema';

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
  ],
  providers: [
    AuthService,
    StudentService,
    JwtStrategy,
    GoogleStrategy,
    LocalStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
